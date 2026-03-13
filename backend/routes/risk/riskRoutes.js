const express = require("express");
const router = express.Router();
const riskController = require("../../controllers/risk/riskController");
const { verifyToken } = require("../../middleware/authMiddleware");

router.get("/summary", verifyToken, riskController.getRiskSummary);

/**
 * GET /api/risk/all
 * Get dynamic risk analysis for all assets
 * Returns array of assets with calculated risk levels based on assigned PII types
 */
router.get("/all", verifyToken, riskController.getAllAssetsRisk);

/**
 * POST /api/risk/recalculate-all
 * Recalculate and persist risk_assessment for all assets
 */
router.post(
	"/recalculate-all",
	verifyToken,
	riskController.recalculateAllAssetRisks,
);

/**
 * GET /api/risk/:assetId
 * Get dynamic risk analysis for a specific asset
 * Returns: { riskScore, riskLevel, piiCount, totalWeight, categories }
 */
router.get("/:assetId", verifyToken, riskController.getAssetRisk);

/**
 * POST /api/risk/:assetId/recalculate
 * Force recalculation of risk for a specific asset
 * Called when PII types are added/removed
 */
router.post(
	"/:assetId/recalculate",
	verifyToken,
	riskController.recalculateAssetRisk,
);

module.exports = router;
