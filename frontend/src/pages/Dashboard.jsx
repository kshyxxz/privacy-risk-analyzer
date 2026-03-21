import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatCard from "../components/dashboard/StatCard";
import RiskChart from "../components/dashboard/RiskChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import api from "../api/axiosConfig";

const DEFAULT_RISK_COUNTS = {
	MINIMAL: 0,
	LOW: 0,
	MODERATE: 0,
	HIGH: 0,
	CRITICAL: 0,
	EXTREME: 0,
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
		minimalRisk: 0,
		lowRisk: 0,
		moderateRisk: 0,
		highRisk: 0,
		criticalRisk: 0,
		extremeRisk: 0,
	});

	const [activities, setActivities] = useState([]);
	const [analystRiskAssets, setAnalystRiskAssets] = useState([]);
	const [highRiskAssetsList, setHighRiskAssetsList] = useState([]);
	const [loading, setLoading] = useState(true);

	const getRiskCounts = (assets = []) => {
		const countsByLevel = assets.reduce(
			(acc, asset) => {
				const level = asset?.riskLevel;
				if (Object.prototype.hasOwnProperty.call(acc, level)) {
					acc[level] += 1;
				}
				return acc;
			},
			{ ...DEFAULT_RISK_COUNTS },
		);

		return {
			countsByLevel,
			highRiskCount:
				countsByLevel.HIGH +
				countsByLevel.CRITICAL +
				countsByLevel.EXTREME,
			mediumRiskCount: countsByLevel.MODERATE,
			lowRiskCount: countsByLevel.MINIMAL + countsByLevel.LOW,
		};
	};

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch data based on role
				if (role === "Admin") {
					setAnalystRiskAssets([]);
					setHighRiskAssetsList([]);
					// Admin can access all data
					const [usersRes, riskRes, piiRes, auditRes] =
						await Promise.all([
							api
								.get("/users")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/risk/all")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/pii")
								.catch(() => ({ data: [], status: 200 })),
							api
								.get("/audit")
								.catch(() => ({ data: [], status: 200 })),
						]);

					const {
						countsByLevel,
						highRiskCount,
						mediumRiskCount,
						lowRiskCount,
					} = getRiskCounts(riskRes.data || []);

					setStats({
						totalUsers: usersRes.data?.length || 0,
						totalAssets: riskRes.data?.length || 0,
						totalPiiTypes: piiRes.data?.length || 0,
						highRiskAssets: highRiskCount,
						mediumRiskAssets: mediumRiskCount,
						lowRiskAssets: lowRiskCount,
					});

					setRiskData({
						minimalRisk: countsByLevel.MINIMAL,
						lowRisk: countsByLevel.LOW,
						moderateRisk: countsByLevel.MODERATE,
						highRisk: countsByLevel.HIGH,
						criticalRisk: countsByLevel.CRITICAL,
						extremeRisk: countsByLevel.EXTREME,
					});

					setActivities(
						auditRes.data?.slice(0, 5).map((log) => ({
							username: log.username,
							action: log.action,
							timestamp: log.timestamp,
						})) || [],
					);
				} else if (role === "Analyst") {
					setHighRiskAssetsList([]);
					// Analyst can access assets and risk data
					const [riskRes, auditRes] = await Promise.all([
						api
							.get("/risk/all")
							.catch(() => ({ data: [], status: 200 })),
						api
							.get("/audit")
							.catch(() => ({ data: [], status: 200 })),
					]);

					const {
						countsByLevel,
						highRiskCount,
						mediumRiskCount,
						lowRiskCount,
					} = getRiskCounts(riskRes.data || []);

					setStats({
						totalAssets: riskRes.data?.length || 0,
						highRiskAssets: highRiskCount,
						mediumRiskAssets: mediumRiskCount,
						lowRiskAssets: lowRiskCount,
						totalUsers: 0,
						totalPiiTypes: 0,
					});

					setRiskData({
						minimalRisk: countsByLevel.MINIMAL,
						lowRisk: countsByLevel.LOW,
						moderateRisk: countsByLevel.MODERATE,
						highRisk: countsByLevel.HIGH,
						criticalRisk: countsByLevel.CRITICAL,
						extremeRisk: countsByLevel.EXTREME,
					});

					setAnalystRiskAssets(
						(riskRes.data || []).slice().sort((a, b) => {
							const aScore = Number(a.riskScore) || 0;
							const bScore = Number(b.riskScore) || 0;
							return bScore - aScore;
						}),
					);

					setActivities(
						auditRes.data?.slice(0, 5).map((log) => ({
							username: log.username,
							action: log.action,
							timestamp: log.timestamp,
						})) || [],
					);
				} else if (role === "Intern") {
					setAnalystRiskAssets([]);
					// Intern can see assets and basic risk info
					const [assetsRes, riskRes] = await Promise.all([
						api
							.get("/assets")
							.catch(() => ({ data: [], status: 200 })),
						api
							.get("/risk/all")
							.catch(() => ({ data: [], status: 200 })),
					]);

					const { highRiskCount } = getRiskCounts(riskRes.data || []);

					const highRiskList = (riskRes.data || []).filter(
						(a) =>
							a.riskLevel === "HIGH" ||
							a.riskLevel === "CRITICAL" ||
							a.riskLevel === "EXTREME",
					);
					setHighRiskAssetsList(highRiskList);

					setStats({
						totalAssets: assetsRes.data?.length || 0,
						totalUsers: 0,
						totalPiiTypes: 0,
						highRiskAssets: highRiskCount,
						mediumRiskAssets: 0,
						lowRiskAssets: 0,
					});

					setRiskData({
						minimalRisk: 0,
						lowRisk: 0,
						moderateRisk: 0,
						highRisk: 0,
						criticalRisk: 0,
						extremeRisk: 0,
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
								alignItems: "stretch",
								minHeight: "450px",
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
								title="Moderate Risk Assets"
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
								alignItems: "stretch",
								minHeight: "450px",
							}}
						>
							<RiskChart data={riskData} />
							<RecentActivity activities={activities} />
						</div>

						{analystRiskAssets.length > 0 && (
							<div
								style={{
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									overflow: "hidden",
									marginBottom: "30px",
								}}
							>
								<div
									style={{
										padding: "16px 20px",
										borderBottom: "1px solid #f0f0f0",
									}}
								>
									<h3 style={{ margin: 0, fontSize: "16px" }}>
										Risk Breakdown by Asset
									</h3>
									<p
										style={{
											margin: "4px 0 0",
											fontSize: "12px",
											color: "#888",
										}}
									>
										Mapped view for the risk summary cards
										above
									</p>
								</div>
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
									}}
								>
									<thead>
										<tr
											style={{
												backgroundColor: "#f8f9fa",
											}}
										>
											{[
												"Asset Name",
												"Database",
												"Table",
												"Risk Level",
												"Risk Score",
											].map((h) => (
												<th
													key={h}
													style={{
														padding: "10px 16px",
														textAlign: "left",
														fontSize: "12px",
														color: "#666",
														fontWeight: "600",
														textTransform:
															"uppercase",
														borderBottom:
															"1px solid #f0f0f0",
													}}
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{analystRiskAssets.map((asset) => {
											const levelColors = {
												EXTREME: {
													bg: "#fde8e8",
													text: "#dc3545",
												},
												CRITICAL: {
													bg: "#fde8d8",
													text: "#a04000",
												},
												HIGH: {
													bg: "#fff3cd",
													text: "#856404",
												},
												MODERATE: {
													bg: "#fff8e1",
													text: "#8a6d3b",
												},
												LOW: {
													bg: "#e8f5e9",
													text: "#2e7d32",
												},
												MINIMAL: {
													bg: "#e3f2fd",
													text: "#1565c0",
												},
											};
											const color = levelColors[
												asset.riskLevel
											] || { bg: "#eee", text: "#333" };

											return (
												<tr
													key={asset.asset_id}
													style={{
														borderBottom:
															"1px solid #f0f0f0",
													}}
												>
													<td
														style={{
															padding:
																"10px 16px",
															fontWeight: "500",
														}}
													>
														{asset.asset_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.db_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.table_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
														}}
													>
														<span
															style={{
																backgroundColor:
																	color.bg,
																color: color.text,
																padding:
																	"2px 10px",
																borderRadius:
																	"12px",
																fontSize:
																	"12px",
																fontWeight:
																	"600",
															}}
														>
															{asset.riskLevel}
														</span>
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.riskScore}%
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}

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
								title="High Risk Assets %"
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

						{highRiskAssetsList.length > 0 && (
							<div
								style={{
									marginTop: "30px",
									backgroundColor: "white",
									borderRadius: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										padding: "16px 20px",
										borderBottom: "1px solid #f0f0f0",
									}}
								>
									<h3 style={{ margin: 0, fontSize: "16px" }}>
										⚠️ High Risk Assets (
										{highRiskAssetsList.length})
									</h3>
									<p
										style={{
											margin: "4px 0 0",
											fontSize: "12px",
											color: "#888",
										}}
									>
										Assets rated HIGH, CRITICAL or EXTREME
										risk
									</p>
								</div>
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
									}}
								>
									<thead>
										<tr
											style={{
												backgroundColor: "#f8f9fa",
											}}
										>
											{[
												"Asset Name",
												"Database",
												"Table",
												"Risk Level",
												"Risk Score",
											].map((h) => (
												<th
													key={h}
													style={{
														padding: "10px 16px",
														textAlign: "left",
														fontSize: "12px",
														color: "#666",
														fontWeight: "600",
														textTransform:
															"uppercase",
														borderBottom:
															"1px solid #f0f0f0",
													}}
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{highRiskAssetsList.map((asset) => {
											const levelColors = {
												HIGH: {
													bg: "#fff3cd",
													text: "#856404",
												},
												CRITICAL: {
													bg: "#fde8d8",
													text: "#a04000",
												},
												EXTREME: {
													bg: "#fde8e8",
													text: "#dc3545",
												},
											};
											const color = levelColors[
												asset.riskLevel
											] || { bg: "#eee", text: "#333" };
											return (
												<tr
													key={asset.asset_id}
													style={{
														borderBottom:
															"1px solid #f0f0f0",
													}}
												>
													<td
														style={{
															padding:
																"10px 16px",
															fontWeight: "500",
														}}
													>
														{asset.asset_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.db_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.table_name}
													</td>
													<td
														style={{
															padding:
																"10px 16px",
														}}
													>
														<span
															style={{
																backgroundColor:
																	color.bg,
																color: color.text,
																padding:
																	"2px 10px",
																borderRadius:
																	"12px",
																fontSize:
																	"12px",
																fontWeight:
																	"600",
															}}
														>
															{asset.riskLevel}
														</span>
													</td>
													<td
														style={{
															padding:
																"10px 16px",
															color: "#666",
														}}
													>
														{asset.riskScore}%
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}

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
