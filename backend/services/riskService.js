const pool = require("../config/db");

/**
 * ============================================================================
 * PRIVACY RISK ANALYZER - COMPREHENSIVE RISK ENGINE
 * ============================================================================
 *
 * This service implements a multi-factor risk assessment engine for data assets.
 * Risk scores are calculated on a 0-150 scale and normalized to 0-100%.
 *
 * RISK CALCULATION FORMULA:
 * -------------------------
 * Base Risk = Sensitivity Level (0-10) + PII Exposure (0-100+bonuses)
 * + Permission Risk (15% contribution)
 * + Audit Activity (15% contribution)
 * - Security Controls (15% reduction)
 *
 * FINAL SCORE RANGE: 0-150 points → Normalized to 0-100%
 *
 * RISK LEVELS:
 * - LOW:    0-40 points   (minimal risk)
 * - MEDIUM: 41-100 points (moderate risk)
 * - HIGH:   101-150 points (critical risk)
 *
 * ============================================================================
 */

/**
 * Sensitivity Level to Risk Score Mapping
 * Used to convert asset sensitivity levels into numeric risk scores
 * Supports both new classification system and legacy values for backward compatibility
 */
const SENSITIVITY_LEVEL_MAPPING = {
	// New classification system
	Public: 1,
	Internal: 3,
	Confidential: 6,
	Sensitive: 8,
	"Highly Sensitive": 10,

	// Legacy values (backward compatibility)
	Low: 1,
	Medium: 5,
	High: 9,
	Unknown: 0,
};

/**
 * Permission Access Type to Risk Score Mapping
 * Used to convert permission access types into numeric risk scores
 * Permissions contribute 15% of the total risk score
 */
const PERMISSION_RISK_MAPPING = {
	READ: 2, // Read Only
	WRITE: 5, // Read + Write
	UPDATE: 5, // Read + Write (same as WRITE)
	ADMIN: 8, // Admin Access
	PUBLIC: 10, // Public Access/API
};

/**
 * Security Control Values
 * Security controls reduce risk by 15% of the total risk score
 */
const SECURITY_CONTROL_VALUES = {
	encryption: 4,
	hashing: 3,
	masking: 1, // Treated as encoding
};

/**
 * Calculate Audit Activity Score based on log count
 * Audit activity contributes 15% of the total risk score
 * @param {number} logCount - Number of audit logs for the asset
 * @returns {number} - Score from 1 to 10
 */
function calculateAuditActivityScore(logCount) {
	if (logCount >= 500) return 10;
	if (logCount >= 100) return 7;
	if (logCount >= 50) return 5;
	if (logCount >= 10) return 3;
	return 1; // 0-10 logs
}

/**
 * COMPREHENSIVE RISK ENGINE
 *
 * Calculates risk score for a data asset based on multiple factors:
 *
 * 1. SENSITIVITY LEVEL (0-10 points)
 *    - Asset's inherent sensitivity classification
 *    - Mapping: Public(1), Internal(3), Confidential(6), Sensitive(8), Highly Sensitive(10)
 *
 * 2. PII EXPOSURE (0-100 points base + bonuses)
 *    - Base: Sum of normalized PII weights (each capped at 10)
 *    - Bonus for PII count: 2-3 types(+5), 4-5 types(+15), 6+ types(+30)
 *    - Critical PII bonus: +10 per PII type with weight ≥30 (before normalization)
 *
 * 3. PERMISSION RISK (+15% of total)
 *    - Average permission score across all roles with access
 *    - Mapping: READ(2), WRITE/UPDATE(5), ADMIN(8), PUBLIC(10)
 *
 * 4. AUDIT ACTIVITY (+15% of total)
 *    - Frequency of access/modifications indicates exposure
 *    - Mapping: 0-10 logs(1), 10-50(3), 50-100(5), 100-500(7), 500+(10)
 *
 * 5. SECURITY CONTROLS (-15% of total)
 *    - Protective measures reduce risk
 *    - Encryption(4) + Hashing(3) + Masking(1), capped at 6
 *
 * FINAL SCORE: 0-150 scale, normalized to 0-100%
 *
 * RISK LEVELS:
 * - LOW: 0-40 points (minimal risk)
 * - MEDIUM: 41-100 points (moderate risk)
 * - HIGH: 101-150 points (critical risk)
 */
async function calculateAssetRisk(assetId) {
	try {
		// ===========================================
		// STEP 1: Fetch Asset Data and Sensitivity Level
		// ===========================================
		const assetQuery = `
			SELECT asset_name, sensitivity_level
			FROM data_assets
			WHERE asset_id = $1
		`;
		const assetResult = await pool.query(assetQuery, [assetId]);
		const assetData = assetResult.rows[0];

		if (!assetData) {
			throw new Error(`Asset with ID ${assetId} not found`);
		}

		const assetName = assetData.asset_name;
		const sensitivityLevel = assetData.sensitivity_level;
		const sensitivityScore =
			SENSITIVITY_LEVEL_MAPPING[sensitivityLevel] || 0;

		// ===========================================
		// STEP 2: Calculate PII Exposure Risk
		// ===========================================
		// Get all PII types assigned to this asset with their weights
		// Normalize each PII weight to max of 10 before calculation
		const piiQuery = `
			SELECT
				COUNT(DISTINCT apm.pii_id) as pii_count,
				COALESCE(SUM(LEAST(pt.pii_weight, 10)), 0) as total_weight,
				ARRAY_AGG(DISTINCT pt.pii_category) as pii_categories,
				MAX(LEAST(pt.pii_weight, 10)) as max_weight,
				COUNT(DISTINCT apm.pii_id) FILTER (WHERE pt.pii_weight >= 30) as critical_pii_count
			FROM asset_pii_mapping apm
			LEFT JOIN pii_types pt ON apm.pii_id = pt.pii_id
			WHERE apm.asset_id = $1
		`;

		const piiResult = await pool.query(piiQuery, [assetId]);
		const piiRow = piiResult.rows[0];

		const piiCount = parseInt(piiRow.pii_count) || 0;
		const totalPiiWeight = parseInt(piiRow.total_weight) || 0;
		const maxPiiWeight = parseInt(piiRow.max_weight) || 0;
		const criticalPiiCount = parseInt(piiRow.critical_pii_count) || 0;
		const piiCategories = (piiRow.pii_categories || []).filter(
			(c) => c !== null,
		);

		// ===========================================
		// STEP 3: Calculate Permission Risk
		// ===========================================
		// Get permissions for this asset to calculate permission risk
		const permissionQuery = `
			SELECT DISTINCT access_type
			FROM access_permissions
			WHERE asset_id = $1
		`;
		const permissionResult = await pool.query(permissionQuery, [assetId]);
		const permissions = permissionResult.rows;

		// Calculate average permission risk score
		let permissionRisk = 0;
		if (permissions.length > 0) {
			const permissionScores = permissions.map(
				(p) => PERMISSION_RISK_MAPPING[p.access_type] || 0,
			);
			permissionRisk =
				permissionScores.reduce((sum, score) => sum + score, 0) /
				permissionScores.length;
		}

		// ===========================================
		// STEP 4: Calculate Audit Activity Risk
		// ===========================================
		// Get audit log count for this asset to calculate activity risk
		const auditQuery = `
			SELECT COUNT(*) as log_count
			FROM audit_logs
			WHERE asset_id = $1
		`;
		const auditResult = await pool.query(auditQuery, [assetId]);
		const auditLogCount = parseInt(auditResult.rows[0]?.log_count) || 0;
		const auditActivityScore = calculateAuditActivityScore(auditLogCount);

		// ===========================================
		// STEP 5: Calculate Security Control Reduction
		// ===========================================
		// Get security controls for this asset
		const securityQuery = `
			SELECT encryption, hashing, masking
			FROM security_controls
			WHERE asset_id = $1
		`;
		const securityResult = await pool.query(securityQuery, [assetId]);
		const securityControls = securityResult.rows[0];

		// Calculate security control score (sum of enabled controls, capped at 6)
		let securityControlScore = 0;
		if (securityControls) {
			if (securityControls.encryption)
				securityControlScore += SECURITY_CONTROL_VALUES.encryption;
			if (securityControls.hashing)
				securityControlScore += SECURITY_CONTROL_VALUES.hashing;
			if (securityControls.masking)
				securityControlScore += SECURITY_CONTROL_VALUES.masking;
		}
		securityControlScore = Math.min(securityControlScore, 6); // Cap at 6

		// ===========================================
		// STEP 6: RISK ENGINE - Calculate Final Risk Score
		// ===========================================
		// Risk score calculated on 0-150 scale, then normalized to 0-100%

		let riskScore = 0;
		let riskLevel = "LOW";

		// --- BASE RISK FACTORS (Core Risk) ---

		// Factor 1: Sensitivity Level (0-10 points)
		// Inherent classification of the asset
		const sensitivityContribution = sensitivityScore;
		riskScore += sensitivityContribution;

		// Factor 2: PII Base Weight (0-100 points)
		// Sum of all normalized PII weights assigned to asset
		const piiBaseScore = Math.min(totalPiiWeight, 100);
		riskScore += piiBaseScore;

		// Factor 3: PII Count Bonus (0-30 points)
		// More PII types = higher exposure risk
		let piiCountBonus = 0;
		if (piiCount >= 6) piiCountBonus = 30;
		else if (piiCount >= 4) piiCountBonus = 15;
		else if (piiCount >= 2) piiCountBonus = 5;
		riskScore += piiCountBonus;

		// Factor 4: Critical PII Bonus (0-N*10 points)
		// High-weight PII types pose significant risk
		const criticalPiiBonus = criticalPiiCount * 10;
		riskScore += criticalPiiBonus;

		// --- ADDITIVE RISK FACTORS (15% each) ---

		// Factor 5: Permission Risk (+15% of total)
		// Broader access permissions increase exposure
		const permissionContribution = (permissionRisk / 10) * 150 * 0.15;
		riskScore += permissionContribution;

		// Factor 6: Audit Activity Risk (+15% of total)
		// Frequent access indicates higher exposure
		const auditContribution = (auditActivityScore / 10) * 150 * 0.15;
		riskScore += auditContribution;

		// --- RISK REDUCTION FACTORS ---

		// Factor 7: Security Controls (-15% of total)
		// Apply reduction only when the asset has PII exposure.
		// This avoids driving non-PII assets to 0 solely due to controls.
		const securityReduction =
			piiCount > 0 ? (securityControlScore / 6) * 150 * 0.15 : 0;
		riskScore -= securityReduction;

		// Ensure score stays within valid range
		riskScore = Math.max(riskScore, 0);
		riskScore = Math.min(riskScore, 150);

		// Determine risk level
		// Assets without PII should still retain non-zero risk from other factors
		// (sensitivity, permissions, audit activity), so only force 0 when score is 0.
		if (riskScore === 0) {
			riskLevel = "LOW";
			riskScore = 0;
		} else if (riskScore <= 40) {
			riskLevel = "LOW";
		} else if (riskScore <= 100) {
			riskLevel = "MEDIUM";
		} else {
			riskLevel = "HIGH";
		}

		return {
			// Asset Information
			assetId,
			assetName,

			// Final Risk Assessment
			riskScore: parseFloat((riskScore / 150) * 100).toFixed(2), // Normalized to 0-100%
			riskLevel,

			// Risk Breakdown Components
			sensitivityLevel,
			sensitivityScore,
			piiCount,
			totalPiiWeight,
			maxPiiWeight,
			criticalPiiCount,
			permissionRisk: parseFloat(permissionRisk).toFixed(2),
			auditLogCount,
			auditActivityScore,
			securityControlScore,
			securityControls: securityControls || {
				encryption: false,
				hashing: false,
				masking: false,
			},
			piiCategories,

			// Calculation Breakdown (for transparency)
			riskBreakdown: {
				sensitivityContribution: parseFloat(
					sensitivityContribution,
				).toFixed(2),
				piiBaseScore: parseFloat(piiBaseScore).toFixed(2),
				piiCountBonus: parseFloat(piiCountBonus).toFixed(2),
				criticalPiiBonus: parseFloat(criticalPiiBonus).toFixed(2),
				permissionContribution: parseFloat(
					permissionContribution,
				).toFixed(2),
				auditContribution: parseFloat(auditContribution).toFixed(2),
				securityReduction: parseFloat(securityReduction).toFixed(2),
			},

			timestamp: new Date(),
		};
	} catch (error) {
		console.error("Error calculating asset risk:", error);
		throw error;
	}
}

/**
 * Calculate risk for all assets
 */
async function calculateAllAssetRisks() {
	try {
		// Get all assets
		const assetsQuery = "SELECT asset_id FROM data_assets";
		const assetsResult = await pool.query(assetsQuery);
		const assets = assetsResult.rows;

		const riskData = [];
		for (const asset of assets) {
			const risk = await calculateAssetRisk(asset.asset_id);
			riskData.push({
				asset_id: asset.asset_id,
				...risk,
			});
		}

		return riskData;
	} catch (error) {
		console.error("Error calculating all asset risks:", error);
		throw error;
	}
}

/**
 * Save risk assessment to database (optional - for historical tracking)
 */
async function saveRiskAssessment(assetId, riskScore, riskLevel) {
	try {
		const query = `
			INSERT INTO risk_assessment (asset_id, risk_score, risk_level, last_analyzed)
			VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
			ON CONFLICT (asset_id)
			DO UPDATE SET
				risk_score = $2,
				risk_level = $3,
				last_analyzed = CURRENT_TIMESTAMP
		`;

		await pool.query(query, [assetId, riskScore, riskLevel]);
	} catch (error) {
		console.error("Error saving risk assessment:", error);
		throw error;
	}
}

/**
 * Get risk assessment from database
 */
async function getRiskAssessment(assetId) {
	try {
		const query = `
			SELECT * FROM risk_assessment WHERE asset_id = $1
		`;
		const result = await pool.query(query, [assetId]);
		return result.rows[0] || null;
	} catch (error) {
		console.error("Error retrieving risk assessment:", error);
		throw error;
	}
}

module.exports = {
	calculateAssetRisk,
	calculateAllAssetRisks,
	saveRiskAssessment,
	getRiskAssessment,
	SENSITIVITY_LEVEL_MAPPING,
	PERMISSION_RISK_MAPPING,
	SECURITY_CONTROL_VALUES,
};
