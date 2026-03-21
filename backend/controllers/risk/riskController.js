const {
	calculateAssetRisk,
	calculateAllAssetRisks,
	saveRiskAssessment,
} = require("../../services/riskService");
const pool = require("../../config/db");
const { logAuditEvent } = require("../../services/auditLogService");

/**
 * Get dynamic risk analysis for a specific asset
 * Calculates risk based on:
 * - PII types assigned to the asset
 * - Weight of each PII type
 * - Total number of PII types
 *
 * Returns: { riskScore, riskLevel, piiCount, totalWeight, categories }
 */
exports.getAssetRisk = async (req, res) => {
	try {
		const { assetId } = req.params;
		const userId = req.user?.user_id;

		// Get asset details
		const assetQuery = "SELECT * FROM data_assets WHERE asset_id = $1";
		const assetResult = await pool.query(assetQuery, [assetId]);

		if (assetResult.rows.length === 0) {
			return res.status(404).json({ error: "Asset not found" });
		}

		const asset = assetResult.rows[0];

		// Calculate dynamic risk
		const riskData = await calculateAssetRisk(assetId);

		// Optionally save to database for audit trail
		await saveRiskAssessment(
			assetId,
			riskData.riskScore,
			riskData.riskLevel,
		);

		// Log the analysis
		await logAuditEvent({
			userId,
			assetId,
			action: "READ",
		});

		res.json({
			asset_id: assetId,
			asset_name: asset.asset_name,
			...riskData,
		});
	} catch (error) {
		console.error("Error getting asset risk:", error);
		res.status(500).json({ error: "Failed to calculate asset risk" });
	}
};

/**
 * Get dynamic risk analysis for ALL assets
 * Returns array of assets with calculated risk levels
 *
 * Used for dashboard and risk overview page
 */
exports.getAllAssetsRisk = async (req, res) => {
	try {
		const userId = req.user?.user_id;

		// Get all assets with their full details
		const assetsQuery = `
			SELECT
				da.asset_id,
				da.asset_name,
				da.db_name,
				da.table_name,
				da.sensitivity_level,
				da.created_at
			FROM data_assets da
			ORDER BY da.asset_id
		`;

		const assetsResult = await pool.query(assetsQuery);
		const assets = assetsResult.rows;

		// Calculate risk for each asset
		const assetsWithRisk = await Promise.all(
			assets.map(async (asset) => {
				const risk = await calculateAssetRisk(asset.asset_id);
				return {
					...asset,
					...risk,
				};
			}),
		);

		res.json(assetsWithRisk);
	} catch (error) {
		console.error("Error getting all assets risk:", error);
		res.status(500).json({
			error: "Failed to calculate risk for all assets",
		});
	}
};

/**
 * Get risk summary statistics across all assets
 * Returns: { totalAssets, countsByLevel, highRiskCount, mediumRiskCount, lowRiskCount, averageRiskScore }
 */
exports.getRiskSummary = async (req, res) => {
	try {
		const userId = req.user?.user_id;

		// Get all assets risks
		const allRisks = await calculateAllAssetRisks();

		// Calculate summary
		const initialCounts = {
			MINIMAL: 0,
			LOW: 0,
			MODERATE: 0,
			HIGH: 0,
			CRITICAL: 0,
			EXTREME: 0,
		};
		const countsByLevel = allRisks.reduce((acc, risk) => {
			const level = risk?.riskLevel;
			if (Object.prototype.hasOwnProperty.call(acc, level)) {
				acc[level] += 1;
			}
			return acc;
		}, initialCounts);

		const highRiskCount =
			countsByLevel.HIGH + countsByLevel.CRITICAL + countsByLevel.EXTREME;
		const mediumRiskCount = countsByLevel.MODERATE;
		const lowRiskCount = countsByLevel.MINIMAL + countsByLevel.LOW;
		const averageRiskScore =
			allRisks.length > 0
				? (
						allRisks.reduce(
							(sum, r) => sum + parseFloat(r.riskScore),
							0,
						) / allRisks.length
					).toFixed(2)
				: 0;

		// Get PII distribution
		const piiDistributionQuery = `
			SELECT
				pt.pii_category,
				COUNT(DISTINCT apm.asset_id) as asset_count,
				COUNT(*) as mapping_count,
				AVG(pt.pii_weight) as avg_weight
			FROM asset_pii_mapping apm
			LEFT JOIN pii_types pt ON apm.pii_id = pt.pii_id
			GROUP BY pt.pii_category
			ORDER BY asset_count DESC
		`;

		const piiDistResult = await pool.query(piiDistributionQuery);
		const piiDistribution = piiDistResult.rows;

		res.json({
			totalAssets: allRisks.length,
			countsByLevel,
			highRiskCount,
			mediumRiskCount,
			lowRiskCount,
			averageRiskScore,
			byCategory: piiDistribution,
		});
	} catch (error) {
		console.error("Error getting risk summary:", error);
		res.status(500).json({ error: "Failed to calculate risk summary" });
	}
};

/**
 * Recalculate and save risk for a specific asset
 * Called when PII types are added/removed from an asset
 */
exports.recalculateAssetRisk = async (req, res) => {
	try {
		const { assetId } = req.params;
		const userId = req.user?.user_id;

		// Calculate risk
		const riskData = await calculateAssetRisk(assetId);

		// Save to database
		await saveRiskAssessment(
			assetId,
			riskData.riskScore,
			riskData.riskLevel,
		);

		// Log the recalculation
		await logAuditEvent({
			userId,
			assetId,
			action: "UPDATE",
		});

		res.json({
			asset_id: assetId,
			message: "Risk recalculated successfully",
			...riskData,
		});
	} catch (error) {
		console.error("Error recalculating asset risk:", error);
		res.status(500).json({ error: "Failed to recalculate asset risk" });
	}
};

/**
 * Recalculate and save risk for all assets
 * Used by Refresh Data button to persist latest risk_assessment snapshot
 */
exports.recalculateAllAssetRisks = async (req, res) => {
	try {
		const userId = req.user?.user_id;

		const assetsResult = await pool.query(
			"SELECT asset_id FROM data_assets ORDER BY asset_id",
		);
		const assets = assetsResult.rows;

		const recalculated = await Promise.all(
			assets.map(async ({ asset_id: assetId }) => {
				const riskData = await calculateAssetRisk(assetId);
				await saveRiskAssessment(
					assetId,
					riskData.riskScore,
					riskData.riskLevel,
				);

				return {
					asset_id: assetId,
					riskScore: riskData.riskScore,
					riskLevel: riskData.riskLevel,
				};
			}),
		);

		await logAuditEvent({
			userId,
			action: "UPDATE",
		});

		res.json({
			message: "All asset risks recalculated and saved",
			totalAssets: recalculated.length,
			results: recalculated,
		});
	} catch (error) {
		console.error("Error recalculating all asset risks:", error);
		res.status(500).json({
			error: "Failed to recalculate all asset risks",
		});
	}
};
