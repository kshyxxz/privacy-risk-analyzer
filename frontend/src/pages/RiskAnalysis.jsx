import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axiosConfig";
import StatCard from "../components/dashboard/StatCard";
import RiskChart from "../components/dashboard/RiskChart";

export default function RiskAnalysis() {
	const [assets, setAssets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Helper: map sensitivity_level to risk category
	const getSensitivityRisk = (sensitivityLevel) => {
		if (!sensitivityLevel) return null;
		const level = sensitivityLevel.toLowerCase();
		if (level === "high") return "high";
		if (level === "medium") return "medium";
		if (level === "low") return "low";
		return null;
	};

	useEffect(() => {
		const fetchAssets = async () => {
			try {
				setLoading(true);
				setError("");
				const res = await api.get("/assets");
				setAssets(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				console.error("Failed to fetch risk data:", err);
				setError("Unable to load risk analysis right now.");
			} finally {
				setLoading(false);
			}
		};

		fetchAssets();
	}, []);

	const riskData = useMemo(() => {
		const highRisk = assets.filter(
			(asset) => getSensitivityRisk(asset.sensitivity_level) === "high",
		).length;
		const mediumRisk = assets.filter(
			(asset) => getSensitivityRisk(asset.sensitivity_level) === "medium",
		).length;
		const lowRisk = assets.filter(
			(asset) => getSensitivityRisk(asset.sensitivity_level) === "low",
		).length;

		return { highRisk, mediumRisk, lowRisk };
	}, [assets]);

	const totalAssets = assets.length;

	return (
		<div>
			<Navbar />
			<div
				style={{
					padding: "30px 20px",
					maxWidth: "1200px",
					margin: "0 auto",
					backgroundColor: "#f5f5f5",
					minHeight: "calc(100vh - 60px)",
				}}
			>
				<h1 style={{ marginTop: 0, marginBottom: "20px" }}>
					Risk Analysis
				</h1>

				{loading && (
					<div style={{ color: "#666" }}>
						Loading risk analysis...
					</div>
				)}

				{!loading && error && <div style={errorStyle}>{error}</div>}

				{!loading && !error && (
					<>
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
								marginBottom: "20px",
							}}
						>
							<StatCard
								title="Total Assets"
								value={totalAssets}
								icon="📦"
								bgColor="#007bff"
							/>
							<StatCard
								title="High Risk"
								value={riskData.highRisk}
								icon="🔴"
								bgColor="#dc3545"
							/>
							<StatCard
								title="Medium Risk"
								value={riskData.mediumRisk}
								icon="🟡"
								bgColor="#ffc107"
							/>
							<StatCard
								title="Low Risk"
								value={riskData.lowRisk}
								icon="🟢"
								bgColor="#28a745"
							/>
						</div>

						<RiskChart data={riskData} />
					</>
				)}
			</div>
		</div>
	);
}

const errorStyle = {
	padding: "12px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
	marginBottom: "16px",
};
