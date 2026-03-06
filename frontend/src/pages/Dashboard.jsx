import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatCard from "../components/dashboard/StatCard";
import RiskChart from "../components/dashboard/RiskChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import api from "../api/axiosConfig";

// Helper: map sensitivity_level to risk category
const getSensitivityRisk = (sensitivityLevel) => {
	if (!sensitivityLevel) return null;
	const level = sensitivityLevel.toLowerCase();
	if (level === "high") return "high";
	if (level === "medium") return "medium";
	if (level === "low") return "low";
	return null;
};

export default function Dashboard() {
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	const role = localStorage.getItem("role") || user?.role;

	const [stats, setStats] = useState({
		totalUsers: 0,
		totalAssets: 0,
		totalPiiTypes: 0,
		highRiskAssets: 0,
		mediumRiskAssets: 0,
		lowRiskAssets: 0,
	});

	const [riskData, setRiskData] = useState({
		highRisk: 0,
		mediumRisk: 0,
		lowRisk: 0,
	});

	const [activities, setActivities] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch data based on role
				if (role === "Admin") {
					// Admin can access all data
					const [usersRes, assetsRes, piiRes, auditRes] =
						await Promise.all([
							api
								.get("/users")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/assets")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/pii")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/audit")
								.catch(() => ({ data: [], status: 200 })),
						]);

					setStats({
						totalUsers: usersRes.data?.length || 0,
						totalAssets: assetsRes.data?.length || 0,
						totalPiiTypes: piiRes.data?.length || 0,
						highRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"high",
							).length || 0,
						mediumRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"medium",
							).length || 0,
						lowRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"low",
							).length || 0,
					});

					setRiskData({
						highRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"high",
							).length || 0,
						mediumRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"medium",
							).length || 0,
						lowRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"low",
							).length || 0,
					});

					setActivities(
						auditRes.data?.slice(0, 5).map((log) => ({
							username: log.username,
							action: log.action,
							timestamp: log.timestamp,
						})) || [],
					);
				} else if (role === "Analyst") {
					// Analyst can access assets and risk data
					const [assetsRes, auditRes] = await Promise.all([
						api
							.get("/assets")
							.catch(() => ({ data: [], status: 200 })),
						api
							.get("/audit")
							.catch(() => ({ data: [], status: 200 })),
					]);

					setStats({
						totalAssets: assetsRes.data?.length || 0,
						highRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"high",
							).length || 0,
						mediumRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"medium",
							).length || 0,
						lowRiskAssets:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"low",
							).length || 0,
						totalUsers: 0,
						totalPiiTypes: 0,
					});

					setRiskData({
						highRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"high",
							).length || 0,
						mediumRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"medium",
							).length || 0,
						lowRisk:
							assetsRes.data?.filter(
								(a) =>
									getSensitivityRisk(a.sensitivity_level) ===
									"low",
							).length || 0,
					});

					setActivities(
						auditRes.data?.slice(0, 5).map((log) => ({
							username: log.username,
							action: log.action,
							timestamp: log.timestamp,
						})) || [],
					);
				} else if (role === "Intern") {
					// Intern can only see assigned assets
					const assetsRes = await api
						.get("/assets")
						.catch(() => ({ data: [], status: 200 }));

					setStats({
						totalAssets: assetsRes.data?.length || 0,
						totalUsers: 0,
						totalPiiTypes: 0,
						highRiskAssets: 0,
						mediumRiskAssets: 0,
						lowRiskAssets: 0,
					});

					setRiskData({
						highRisk: 0,
						mediumRisk: 0,
						lowRisk: 0,
					});
				}
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [role]);

	if (loading) {
		return (
			<div>
				<Navbar />
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "calc(100vh - 60px)",
					}}
				>
					<div style={{ fontSize: "18px", color: "#888" }}>
						Loading dashboard...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<Navbar />
			<div
				style={{
					padding: "30px 20px",
					maxWidth: "1400px",
					margin: "0 auto",
					backgroundColor: "#f5f5f5",
					minHeight: "calc(100vh - 60px)",
				}}
			>
				{/* Admin Dashboard */}
				{role === "Admin" && (
					<>
						<h1 style={{ marginTop: 0, marginBottom: "30px" }}>
							Admin Dashboard
						</h1>

						{/* Statistics Cards */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
								marginBottom: "30px",
							}}
						>
							<StatCard
								title="Total Users"
								value={stats.totalUsers}
								icon="👥"
								bgColor="#007bff"
							/>
							<StatCard
								title="Total Assets"
								value={stats.totalAssets}
								icon="📊"
								bgColor="#28a745"
							/>
							<StatCard
								title="Total PII Types"
								value={stats.totalPiiTypes}
								icon="🔒"
								bgColor="#17a2b8"
							/>
							<StatCard
								title="High Risk Assets"
								value={stats.highRiskAssets}
								icon="⚠️"
								bgColor="#dc3545"
							/>
						</div>

						{/* Risk Chart and Recent Activity */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "20px",
								marginBottom: "30px",
							}}
						>
							<RiskChart data={riskData} />
							<RecentActivity activities={activities} />
						</div>

						{/* Management Links */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
							}}
						>
							<div
								onClick={() => navigate("/users")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									👤
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Users Management
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Manage system users
								</p>
							</div>

							<div
								onClick={() => navigate("/assets")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📦
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Data Assets
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									View all assets
								</p>
							</div>

							<div
								onClick={() => navigate("/pii-types")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									🔐
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									PII Types
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Manage PII categories
								</p>
							</div>

							<div
								onClick={() => navigate("/permissions")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									🔑
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Permissions
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Control access
								</p>
							</div>

							<div
								onClick={() => navigate("/security-controls")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									🛡️
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Security Controls
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Manage protections
								</p>
							</div>

							<div
								onClick={() => navigate("/risk-analysis")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📈
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Risk Analysis
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Analyze risks
								</p>
							</div>

							<div
								onClick={() => navigate("/audit-logs")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📋
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Audit Logs
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									View activities
								</p>
							</div>
						</div>
					</>
				)}

				{/* Analyst Dashboard */}
				{role === "Analyst" && (
					<>
						<h1 style={{ marginTop: 0, marginBottom: "30px" }}>
							Analyst Dashboard
						</h1>

						{/* Statistics Cards */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
								marginBottom: "30px",
							}}
						>
							<StatCard
								title="Total Assets"
								value={stats.totalAssets}
								icon="📊"
								bgColor="#28a745"
							/>
							<StatCard
								title="High Risk Assets"
								value={stats.highRiskAssets}
								icon="🔴"
								bgColor="#dc3545"
							/>
							<StatCard
								title="Medium Risk Assets"
								value={stats.mediumRiskAssets}
								icon="🟡"
								bgColor="#ffc107"
							/>
							<StatCard
								title="Low Risk Assets"
								value={stats.lowRiskAssets}
								icon="🟢"
								bgColor="#28a745"
							/>
						</div>

						{/* Risk Chart and Recent Activity */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "20px",
								marginBottom: "30px",
							}}
						>
							<RiskChart data={riskData} />
							<RecentActivity activities={activities} />
						</div>

						{/* Analysis Links */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
							}}
						>
							<div
								onClick={() => navigate("/assets")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📦
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Data Assets
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									View assets
								</p>
							</div>

							<div
								onClick={() => navigate("/risk-analysis")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📈
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Risk Analysis
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Analyze risks
								</p>
							</div>

							<div
								onClick={() => navigate("/audit-logs")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📋
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									Audit Logs
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									View logs
								</p>
							</div>
						</div>
					</>
				)}

				{/* Intern Dashboard */}
				{role === "Intern" && (
					<>
						<h1 style={{ marginTop: 0, marginBottom: "30px" }}>
							Welcome, {user?.username}
						</h1>

						{/* Statistics Cards */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
								marginBottom: "30px",
							}}
						>
							<StatCard
								title="Assigned Assets"
								value={stats.totalAssets}
								icon="📊"
								bgColor="#28a745"
							/>
							<StatCard
								title="Asset Sensitivity"
								value={`${Math.round((stats.highRiskAssets / Math.max(stats.totalAssets, 1)) * 100)}%`}
								icon="⚠️"
								bgColor="#dc3545"
							/>
						</div>

						{/* Available Modules */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit, minmax(200px, 1fr))",
								gap: "20px",
							}}
						>
							<div
								onClick={() => navigate("/assets")}
								style={{
									padding: "20px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									cursor: "pointer",
									transition: "transform 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform =
										"translateY(-5px)")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform =
										"translateY(0)")
								}
							>
								<div
									style={{
										fontSize: "30px",
										marginBottom: "10px",
									}}
								>
									📦
								</div>
								<h3 style={{ margin: "0 0 5px 0" }}>
									View Data Assets
								</h3>
								<p
									style={{
										margin: 0,
										color: "#888",
										fontSize: "12px",
									}}
								>
									Read-only access
								</p>
							</div>
						</div>

						<div
							style={{
								marginTop: "30px",
								padding: "20px",
								backgroundColor: "white",
								borderRadius: "8px",
								boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
							}}
						>
							<p style={{ color: "#666", lineHeight: "1.6" }}>
								As an Intern, you have read-only access to view
								data assets assigned to you. For more detailed
								analysis or to manage assets, please contact
								your supervisor.
							</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
