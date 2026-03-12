const pool = require("../config/db");

const SENSITIVITY_LEVEL_MAPPING = {
	Public: 0.2,
	Internal: 0.4,
	Confidential: 0.6,
	Restricted: 0.8,
	"Top Secret": 1.0,

	// Backward compatibility aliases
	Sensitive: 0.8,
	"Highly Sensitive": 1.0,
	Low: 0.2,
	Medium: 0.6,
	High: 0.8,
	Unknown: 0,
};

/**
 * Permission access mapping used to compute Permission%.
 */
const PERMISSION_RISK_MAPPING = {
	READ: 1,
	WRITE: 2,
	UPDATE: 3,
	DELETE: 4,
};

const BASELINE_ROLE_COUNT = 3;
const BASELINE_PERMISSION_SCORE_CAP = BASELINE_ROLE_COUNT * 10;

/**
 * Security control reduction values used to compute Security%.
 */
const SECURITY_CONTROL_VALUES = {
	encryption: 0.5,
	hashing: 0.33,
	masking: 0.17, // Encoding-equivalent control
};

/**
 * Normalize raw audit log count to 0-1 scale.
 */
function normalizeAuditPercent(logCount) {
	return Math.min(Math.max(logCount, 0), 1000) / 1000;
}

/**
 * DYNAMIC RISK ENGINE
 *
 * Calculates risk score for a data asset based on multiple factors:
 *
 * 1. Compute Final_Score from weighted factors and security reduction
 * 2. Compute Max_Score as asset-specific ceiling excluding security reduction
 * 3. Resolve label from fixed % bands of Max_Score
 *
 * RISK LEVELS (based on normalized % of ceiling):
 * - MINIMAL: 0% - 5%
 * - LOW: >5% - 20%
 * - MODERATE: >20% - 40%
 * - HIGH: >40% - 65%
 * - CRITICAL: >65% - 85%
 * - EXTREME: >85% - 100%
 */
async function calculateAssetRisk(assetId) {
	try {
		// ===========================================
		// STEP 1: Fetch Asset Data and Sensitivity Level
		// ===========================================
		const assetQuery = `
			SELECT asset_name, sensitivity_level, contains_pii
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
		const containsPii = Boolean(assetData.contains_pii);
		const sensitivityPercent =
			SENSITIVITY_LEVEL_MAPPING[sensitivityLevel] || 0;

		// ===========================================
		// STEP 2: Calculate PII Exposure Risk
		// ===========================================
		// Get all PII types assigned to this asset with their full weights
		const piiQuery = `
			SELECT
				COUNT(apm.pii_id) as pii_count,
				COALESCE(SUM(pt.pii_weight), 0) as total_weight,
				ARRAY_AGG(DISTINCT pt.pii_category) as pii_categories,
				MAX(pt.pii_weight) as max_weight,
				COUNT(apm.pii_id) FILTER (WHERE pt.pii_weight >= 70) as critical_pii_count
			FROM (
				SELECT DISTINCT pii_id
				FROM asset_pii_mapping
				WHERE asset_id = $1
			) apm
			LEFT JOIN pii_types pt ON apm.pii_id = pt.pii_id
		`;

		// ===========================================
		// STEP 3: Calculate Permission Risk
		// ===========================================
		// Get permissions for this asset to calculate permission risk
		const permissionQuery = `
			SELECT ap.access_type, r.role_name
			FROM access_permissions ap
			JOIN roles r ON ap.role_id = r.role_id
			WHERE ap.asset_id = $1
			ORDER BY r.role_name, ap.access_type
		`;

		// ===========================================
		// STEP 4: Calculate Audit Activity Risk
		// ===========================================
		// Get audit log count for this asset to calculate activity risk
		const auditQuery = `
			SELECT COUNT(*) as log_count
			FROM audit_logs
			WHERE asset_id = $1
		`;

		// ===========================================
		// STEP 5: Calculate Security Control Reduction
		// ===========================================
		// Get security controls for this asset
		const securityQuery = `
			SELECT encryption, hashing, masking
			FROM security_controls
			WHERE asset_id = $1
		`;

		// Run independent lookups concurrently to reduce end-to-end latency.
		const [piiResult, permissionResult, auditResult, securityResult] =
			await Promise.all([
				pool.query(piiQuery, [assetId]),
				pool.query(permissionQuery, [assetId]),
				pool.query(auditQuery, [assetId]),
				pool.query(securityQuery, [assetId]),
			]);

		const piiRow = piiResult.rows[0];
		const piiCount = parseInt(piiRow.pii_count) || 0;
		const totalPiiWeight = parseInt(piiRow.total_weight) || 0;
		const maxPiiWeight = parseInt(piiRow.max_weight) || 0;
		const criticalPiiCount = parseInt(piiRow.critical_pii_count) || 0;
		const piiCategories = (piiRow.pii_categories || []).filter(
			(c) => c !== null,
		);

		const permissions = permissionResult.rows;
		const rolesWithAccess = new Set(
			permissions
				.map((permission) => permission.role_name)
				.filter(Boolean),
		).size;

		const permissionScoreSum = permissions.reduce((sum, permission) => {
			const accessType = String(
				permission.access_type || "",
			).toUpperCase();
			return sum + (PERMISSION_RISK_MAPPING[accessType] || 0);
		}, 0);
		const permissionScoreCap = BASELINE_PERMISSION_SCORE_CAP;
		const permissionPercent =
			permissionScoreCap > 0
				? Math.min(permissionScoreSum, permissionScoreCap) /
					permissionScoreCap
				: 0;

		const auditLogCount = parseInt(auditResult.rows[0]?.log_count) || 0;
		const auditPercent = normalizeAuditPercent(auditLogCount);

		const securityControls = securityResult.rows[0];

		// Calculate Security% (sum of enabled controls, capped at 1.0)
		let securityPercent = 0;
		if (securityControls) {
			if (securityControls.encryption)
				securityPercent += SECURITY_CONTROL_VALUES.encryption;
			if (securityControls.hashing)
				securityPercent += SECURITY_CONTROL_VALUES.hashing;
			if (securityControls.masking)
				securityPercent += SECURITY_CONTROL_VALUES.masking;
		}
		securityPercent = Math.min(securityPercent, 1);

		// ===========================================
		// STEP 6: RISK ENGINE - Calculate Final Risk Score
		// ===========================================

		const piiGate = containsPii ? 1 : 0;
		const piiNormalized = Math.min(totalPiiWeight, 300) / 300;

		const sensitivityContribution = sensitivityPercent * 0.2;
		const piiContribution = piiNormalized * 0.35 * piiGate;
		const permissionContribution = permissionPercent * 0.25;
		const auditContribution = auditPercent * 0.1;

		const rawRisk =
			sensitivityContribution +
			piiContribution +
			permissionContribution +
			auditContribution;

		const securityReduction = securityPercent * 0.3;
		const finalNormalizedScore = Math.min(
			1,
			Math.max(rawRisk - securityReduction, 0),
		);
		const riskScore = finalNormalizedScore * 100;

		// Layer 2: compute per-asset ceiling (security excluded)
		const maxSensitivity = 0.2;
		const maxPermissions = 0.25;
		const maxAudit = 0.1;
		const maxPii = piiNormalized * 0.35 * piiGate;
		const maxRaw = maxSensitivity + maxPii + maxPermissions + maxAudit;
		const maxScore = Math.min(Math.max(maxRaw, 0), 1) * 100;

		const t1 = maxScore * 0.05;
		const t2 = maxScore * 0.2;
		const t3 = maxScore * 0.4;
		const t4 = maxScore * 0.65;
		const t5 = maxScore * 0.85;

		// Layer 3: resolve label against dynamic ceiling thresholds
		let riskLevel = "MINIMAL";
		if (riskScore <= t1) {
			riskLevel = "MINIMAL";
		} else if (riskScore <= t2) {
			riskLevel = "LOW";
		} else if (riskScore <= t3) {
			riskLevel = "MODERATE";
		} else if (riskScore <= t4) {
			riskLevel = "HIGH";
		} else if (riskScore <= t5) {
			riskLevel = "CRITICAL";
		} else {
			riskLevel = "EXTREME";
		}

		return {
			// Asset Information
			assetId,
			assetName,

			// Final Risk Assessment
			riskScore: riskScore.toFixed(2),
			riskLevel,
			maxScore: maxScore.toFixed(2),

			// Risk Breakdown Components
			containsPii,
			piiGate,
			sensitivityLevel,
			sensitivityScore: (sensitivityPercent * 10).toFixed(2),
			piiCount,
			totalPiiWeight,
			maxPiiWeight,
			criticalPiiCount,
			permissionRisk: (permissionPercent * 10).toFixed(2),
			auditLogCount,
			auditActivityScore: (auditPercent * 10).toFixed(2),
			securityControlScore: (securityPercent * 6).toFixed(2),
			securityControls: securityControls || {
				encryption: false,
				hashing: false,
				masking: false,
			},
			piiCategories,

			// Permission details for display
			permissions: permissions.reduce((groups, p) => {
				const key = p.role_name;
				if (!groups[key]) groups[key] = [];
				groups[key].push(p.access_type);
				return groups;
			}, {}),
			permissionRawScore: permissionScoreSum,
			permissionScoreCap,
			rolesWithAccess,

			// Calculation Breakdown (for transparency)
			riskBreakdown: {
				sensitivityContribution: (
					sensitivityContribution * 100
				).toFixed(2),
				piiBaseScore: (piiContribution * 100).toFixed(2),
				piiCountBonus: "0.00",
				criticalPiiBonus: "0.00",
				permissionContribution: (permissionContribution * 100).toFixed(
					2,
				),
				auditContribution: (auditContribution * 100).toFixed(2),
				securityReduction: (securityReduction * 100).toFixed(2),
				rawRiskScore: (rawRisk * 100).toFixed(2),
				permissionRawScore: permissionScoreSum,
				permissionScoreCap,
				rolesWithAccess,
				maxScore: maxScore.toFixed(2),
				thresholds: {
					minimal: t1.toFixed(2),
					low: t2.toFixed(2),
					moderate: t3.toFixed(2),
					high: t4.toFixed(2),
					critical: t5.toFixed(2),
					extreme: maxScore.toFixed(2),
				},
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

		return Promise.all(
			assets.map(async (asset) => {
				const risk = await calculateAssetRisk(asset.asset_id);
				return {
					asset_id: asset.asset_id,
					...risk,
				};
			}),
		);
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
