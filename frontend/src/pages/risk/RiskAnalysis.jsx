import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosConfig";

const normalizeSensitivityLabel = (level) => {
	switch (level) {
		case "Sensitive":
			return "Restricted";
		case "Highly Sensitive":
			return "Top Secret";
		default:
			return level;
	}
};

const toContributionDisplay = (value) => {
	const normalized = Number.parseFloat(value || 0) / 100;
	if (normalized !== 0 && Math.abs(normalized) < 0.01) {
		return normalized.toFixed(4);
	}
	return normalized.toFixed(2);
};

export default function RiskAnalysis() {
	const [assets, setAssets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [expandedAsset, setExpandedAsset] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	const fetchRiskAnalysis = async (isManualRefresh = false) => {
		try {
			if (isManualRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}
			setError("");
			const res = await api.get("/risk/all");
			const normalizeAsset = (asset) => {
				const securityControls = asset.securityControls ||
					asset.security_controls || {
						encryption: Boolean(asset.encryption),
						hashing: Boolean(asset.hashing),
						masking: Boolean(asset.masking),
					};

				return {
					...asset,
					asset_id: asset.asset_id ?? asset.assetId,
					asset_name: asset.asset_name ?? asset.assetName,
					riskScore: asset.riskScore ?? asset.risk_score ?? "0.00",
					riskLevel: asset.riskLevel ?? asset.risk_level ?? "MINIMAL",
					sensitivityLevel: normalizeSensitivityLabel(
						asset.sensitivityLevel ?? asset.sensitivity_level ?? "",
					),
					sensitivityScore:
						asset.sensitivityScore ?? asset.sensitivity_score ?? 0,
					piiCount: asset.piiCount ?? asset.pii_count ?? 0,
					totalPiiWeight:
						asset.totalPiiWeight ?? asset.total_pii_weight ?? 0,
					criticalPiiCount:
						asset.criticalPiiCount ?? asset.critical_pii_count ?? 0,
					permissionRisk:
						asset.permissionRisk ?? asset.permission_risk ?? "0.00",
					permissionRawScore:
						asset.permissionRawScore ??
						asset.permission_raw_score ??
						asset.riskBreakdown?.permissionRawScore ??
						0,
					permissionScoreCap:
						asset.permissionScoreCap ??
						asset.permission_score_cap ??
						asset.riskBreakdown?.permissionScoreCap ??
						20,
					rolesWithAccess:
						asset.rolesWithAccess ??
						asset.roles_with_access ??
						asset.riskBreakdown?.rolesWithAccess ??
						Object.keys(asset.permissions ?? {}).length,
					auditLogCount:
						asset.auditLogCount ?? asset.audit_log_count ?? 0,
					auditActivityScore:
						asset.auditActivityScore ??
						asset.audit_activity_score ??
						0,
					securityControlScore:
						asset.securityControlScore ??
						asset.security_control_score ??
						0,
					securityControls,
					permissions: asset.permissions ?? {},
				};
			};

			setAssets(
				Array.isArray(res.data)
					? res.data.map((asset) => normalizeAsset(asset))
					: [],
			);
		} catch (err) {
			console.error("Failed to fetch risk data:", err);
			setError("Unable to load risk analysis right now.");
		} finally {
			if (isManualRefresh) {
				setRefreshing(false);
			}
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRiskAnalysis();
	}, []);

	const getRiskLevelColor = (level) => {
		switch (level) {
			case "EXTREME":
				return "#7f1d1d";
			case "CRITICAL":
				return "#dc2626";
			case "HIGH":
				return "#ef4444";
			case "MODERATE":
				return "#f59e0b";
			case "LOW":
				return "#84cc16";
			case "MINIMAL":
				return "#16a34a";
			default:
				return "#6c757d";
		}
	};

	const toggleAssetDetails = (assetId) => {
		setExpandedAsset(expandedAsset === assetId ? null : assetId);
	};

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
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: "12px",
						marginBottom: "20px",
						flexWrap: "wrap",
					}}
				>
					<h1 style={{ margin: 0 }}>Risk Analysis</h1>
					<button
						type="button"
						onClick={() => fetchRiskAnalysis(true)}
						disabled={refreshing}
						style={{
							padding: "8px 14px",
							borderRadius: "6px",
							border: "none",
							backgroundColor: refreshing ? "#6c757d" : "#007bff",
							color: "#fff",
							cursor: refreshing ? "not-allowed" : "pointer",
						}}
					>
						{refreshing ? "Refreshing..." : "Refresh Data"}
					</button>
				</div>

				{loading && (
					<div style={{ color: "#666" }}>
						Loading risk analysis...
					</div>
				)}

				{!loading && error && <div style={errorStyle}>{error}</div>}

				{!loading && !error && (
					<>
						{/* Detailed Asset Risk Table */}
						<div
							style={{
								backgroundColor: "white",
								borderRadius: "8px",
								boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
								padding: "20px",
							}}
						>
							<h2 style={{ marginTop: 0, marginBottom: "15px" }}>
								Detailed Asset Risk Analysis
							</h2>
							<p style={{ color: "#666", marginBottom: "20px" }}>
								Click on any asset to view detailed risk
								breakdown
							</p>

							{assets.length === 0 ? (
								<div
									style={{
										color: "#666",
										padding: "20px",
										textAlign: "center",
									}}
								>
									No assets available for analysis
								</div>
							) : (
								<div style={{ overflowX: "auto" }}>
									<table style={tableStyle}>
										<thead>
											<tr
												style={{
													backgroundColor: "#f8f9fa",
												}}
											>
												<th style={headerCellStyle}>
													Asset Name
												</th>
												<th style={headerCellStyle}>
													Risk Score
												</th>
												<th style={headerCellStyle}>
													Risk Level
												</th>
												<th style={headerCellStyle}>
													Sensitivity
												</th>
												<th style={headerCellStyle}>
													PII Types
												</th>
												<th style={headerCellStyle}>
													Permission Risk
												</th>
												<th style={headerCellStyle}>
													Audit Logs
												</th>
												<th style={headerCellStyle}>
													Security Controls
												</th>
												<th style={headerCellStyle}>
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{assets.map((asset) => (
												<>
													<tr
														key={asset.asset_id}
														style={rowStyle}
													>
														<td style={cellStyle}>
															<strong>
																{
																	asset.asset_name
																}
															</strong>
															{asset.db_name && (
																<div
																	style={{
																		fontSize:
																			"12px",
																		color: "#666",
																	}}
																>
																	{
																		asset.db_name
																	}
																</div>
															)}
														</td>
														<td style={cellStyle}>
															<div
																style={{
																	fontWeight:
																		"bold",
																	fontSize:
																		"18px",
																	color: getRiskLevelColor(
																		asset.riskLevel,
																	),
																}}
															>
																{
																	asset.riskScore
																}
																%
															</div>
														</td>
														<td style={cellStyle}>
															<span
																style={{
																	...riskBadgeStyle,
																	backgroundColor:
																		getRiskLevelColor(
																			asset.riskLevel,
																		),
																}}
															>
																{
																	asset.riskLevel
																}
															</span>
														</td>
														<td style={cellStyle}>
															{asset.sensitivityLevel ? (
																<>
																	<div>
																		{
																			asset.sensitivityLevel
																		}
																	</div>
																	<div
																		style={{
																			fontSize:
																				"12px",
																			color: "#666",
																		}}
																	>
																		Sensitivity
																		Score:{" "}
																		{toContributionDisplay(
																			asset
																				.riskBreakdown
																				?.sensitivityContribution,
																		)}
																		/ 0.20
																	</div>
																</>
															) : (
																<div
																	style={{
																		color: "#999",
																		fontStyle:
																			"italic",
																	}}
																>
																	—
																</div>
															)}
														</td>
														<td style={cellStyle}>
															<div
																style={{
																	fontWeight:
																		"bold",
																}}
															>
																{asset.piiCount}{" "}
																types
															</div>
															<div
																style={{
																	fontSize:
																		"12px",
																	color: "#666",
																}}
															>
																PII Score:{" "}
																{toContributionDisplay(
																	asset
																		.riskBreakdown
																		?.piiBaseScore,
																)}
																/ 0.35
															</div>
															<div
																style={{
																	fontSize:
																		"12px",
																	color: "#666",
																}}
															>
																Total Weight:{" "}
																{
																	asset.totalPiiWeight
																}
															</div>
															{asset.criticalPiiCount >
																0 && (
																<div
																	style={{
																		fontSize:
																			"11px",
																		color: "#dc3545",
																	}}
																>
																	⚠️{" "}
																	{
																		asset.criticalPiiCount
																	}{" "}
																	critical
																</div>
															)}
														</td>
														<td style={cellStyle}>
															<div
																style={{
																	fontWeight:
																		"500",
																}}
															>
																Permission
																Score:{" "}
																{toContributionDisplay(
																	asset
																		.riskBreakdown
																		?.permissionContribution,
																)}
																/ 0.25
															</div>
															<div
																style={{
																	fontSize:
																		"12px",
																	color: "#666",
																}}
															>
																Roles:{" "}
																{
																	asset.rolesWithAccess
																}{" "}
																| Access Score:{" "}
																{
																	asset.permissionRawScore
																}{" "}
																/{" "}
																{
																	asset.permissionScoreCap
																}
															</div>
														</td>
														<td style={cellStyle}>
															<div>
																{
																	asset.auditLogCount
																}{" "}
																logs
															</div>
															<div
																style={{
																	fontSize:
																		"12px",
																	color: "#666",
																}}
															>
																Audit Score:{" "}
																{toContributionDisplay(
																	asset
																		.riskBreakdown
																		?.auditContribution,
																)}
																/ 0.10
															</div>
														</td>
														<td style={cellStyle}>
															{asset
																.securityControls
																?.encryption ||
															asset
																.securityControls
																?.hashing ||
															asset
																.securityControls
																?.masking ? (
																<>
																	<div
																		style={{
																			fontSize:
																				"13px",
																			marginBottom:
																				"2px",
																		}}
																	>
																		{asset
																			.securityControls
																			?.encryption &&
																			"🔒 "}
																		{asset
																			.securityControls
																			?.hashing &&
																			"# "}
																		{asset
																			.securityControls
																			?.masking &&
																			"⌘ "}
																	</div>
																	<div
																		style={{
																			fontSize:
																				"11px",
																			color: "#666",
																		}}
																	>
																		Security
																		Reduction:{" "}
																		{toContributionDisplay(
																			asset
																				.riskBreakdown
																				?.securityReduction,
																		)}
																		/ 0.30
																	</div>
																</>
															) : (
																<div
																	style={{
																		color: "#999",
																		fontStyle:
																			"italic",
																	}}
																>
																	None
																</div>
															)}
														</td>
														<td style={cellStyle}>
															<button
																onClick={() =>
																	toggleAssetDetails(
																		asset.asset_id,
																	)
																}
																style={
																	detailButtonStyle
																}
															>
																{expandedAsset ===
																asset.asset_id
																	? "▼ Hide"
																	: "▶ Details"}
															</button>
														</td>
													</tr>

													{expandedAsset ===
														asset.asset_id && (
														<tr>
															<td
																colSpan="9"
																style={
																	expandedCellStyle
																}
															>
																<div
																	style={
																		breakdownContainerStyle
																	}
																>
																	<h3
																		style={{
																			marginTop: 0,
																		}}
																	>
																		Risk
																		Breakdown
																		for "
																		{
																			asset.asset_name
																		}
																		"
																	</h3>
																	<p
																		style={{
																			marginTop:
																				"-6px",
																			marginBottom:
																				"14px",
																			fontSize:
																				"13px",
																			color: "#555",
																		}}
																	>
																		Higher
																		values
																		in the
																		first
																		four
																		cards
																		add
																		risk.
																		Security
																		controls
																		reduce
																		risk.
																	</p>

																	<div
																		style={
																			breakdownGridStyle
																		}
																	>
																		{/* Sensitivity Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#007bff",
																				)}
																			>
																				🏷️
																				Data
																				Sensitivity
																				(adds
																				risk)
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Data
																						label:
																					</span>
																					<strong>
																						{asset.sensitivityLevel ||
																							"Not Set"}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Sensitivity
																						Score:
																					</span>
																					<strong>
																						{toContributionDisplay(
																							asset
																								.riskBreakdown
																								?.sensitivityContribution,
																						)}{" "}
																						/
																						0.20
																					</strong>
																				</div>
																			</div>
																		</div>

																		{/* PII Exposure Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#673ab7",
																				)}
																			>
																				📋
																				PII
																				Exposure
																				(adds
																				risk)
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						PII
																						Score:
																					</span>
																					<strong>
																						{toContributionDisplay(
																							asset
																								.riskBreakdown
																								?.piiBaseScore,
																						)}{" "}
																						/
																						0.35
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Types
																						|
																						Total
																						Weight:
																					</span>
																					<strong>
																						{
																							asset.piiCount
																						}{" "}
																						|{" "}
																						{
																							asset.totalPiiWeight
																						}
																					</strong>
																				</div>
																				{asset.piiCategories &&
																					asset
																						.piiCategories
																						.length >
																						0 && (
																						<div
																							style={{
																								marginTop:
																									"8px",
																								fontSize:
																									"12px",
																							}}
																						>
																							<div
																								style={{
																									color: "#666",
																									marginBottom:
																										"4px",
																								}}
																							>
																								Categories
																								on
																								this
																								asset:
																							</div>
																							{asset.piiCategories.map(
																								(
																									cat,
																									idx,
																								) => (
																									<span
																										key={
																											idx
																										}
																										style={
																											categoryTagStyle
																										}
																									>
																										{
																											cat
																										}
																									</span>
																								),
																							)}
																						</div>
																					)}
																			</div>
																		</div>

																		{/* Permission Risk Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#ff9800",
																				)}
																			>
																				🔐
																				Access
																				Scope
																				(adds
																				risk)
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Permission
																						Score:
																					</span>
																					<strong>
																						{toContributionDisplay(
																							asset
																								.riskBreakdown
																								?.permissionContribution,
																						)}{" "}
																						/
																						0.25
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Roles
																						|
																						Access
																						Score:
																					</span>
																					<strong>
																						{
																							asset.rolesWithAccess
																						}{" "}
																						|{" "}
																						{
																							asset.permissionRawScore
																						}{" "}
																						/{" "}
																						{
																							asset.permissionScoreCap
																						}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Adds
																						to
																						risk:
																					</span>
																					<strong>
																						+
																						{
																							asset
																								.riskBreakdown
																								?.permissionContribution
																						}{" "}
																						pts
																						(25%)
																					</strong>
																				</div>
																			</div>
																		</div>

																		{/* Audit Activity Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#2196f3",
																				)}
																			>
																				📊
																				Usage
																				Activity
																				(adds
																				risk)
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Recorded
																						events:
																					</span>
																					<strong>
																						{
																							asset.auditLogCount
																						}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Audit
																						Score:
																					</span>
																					<strong>
																						{toContributionDisplay(
																							asset
																								.riskBreakdown
																								?.auditContribution,
																						)}{" "}
																						/
																						0.10
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Adds
																						to
																						risk:
																					</span>
																					<strong>
																						+
																						{
																							asset
																								.riskBreakdown
																								?.auditContribution
																						}{" "}
																						pts
																						(10%)
																					</strong>
																				</div>
																			</div>
																		</div>

																		{/* Security Controls Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#28a745",
																				)}
																			>
																				🛡️
																				Protection
																				Controls
																				(reduces
																				risk)
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Encryption:
																					</span>
																					<strong>
																						{asset
																							.securityControls
																							?.encryption
																							? "✓ Enabled"
																							: "✗ Disabled"}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Hashing:
																					</span>
																					<strong>
																						{asset
																							.securityControls
																							?.hashing
																							? "✓ Enabled"
																							: "✗ Disabled"}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Encoding:
																					</span>
																					<strong>
																						{asset
																							.securityControls
																							?.masking
																							? "✓ Enabled"
																							: "✗ Disabled"}
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Security
																						Reduction:
																					</span>
																					<strong>
																						{toContributionDisplay(
																							asset
																								.riskBreakdown
																								?.securityReduction,
																						)}{" "}
																						/
																						0.30
																					</strong>
																				</div>
																				<div
																					style={
																						metricRowStyle
																					}
																				>
																					<span>
																						Reduces
																						risk:
																					</span>
																					<strong
																						style={{
																							color: "#28a745",
																						}}
																					>
																						-
																						{
																							asset
																								.riskBreakdown
																								?.securityReduction
																						}{" "}
																						pts
																						(30%)
																					</strong>
																				</div>
																			</div>
																		</div>

																		{/* Permissions Section */}
																		<div
																			style={
																				factorCardStyle
																			}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#6d28d9",
																				)}
																			>
																				🔑
																				Role
																				Permissions
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				{asset.permissions &&
																				Object.keys(
																					asset.permissions,
																				)
																					.length >
																					0 ? (
																					Object.entries(
																						asset.permissions,
																					).map(
																						([
																							roleName,
																							accessTypes,
																						]) => (
																							<div
																								key={
																									roleName
																								}
																								style={{
																									display:
																										"flex",
																									justifyContent:
																										"space-between",
																									alignItems:
																										"center",
																									padding:
																										"6px 0",
																									borderBottom:
																										"1px solid #f0f0f0",
																								}}
																							>
																								<span
																									style={{
																										fontSize:
																											"13px",
																										fontWeight:
																											"500",
																									}}
																								>
																									{
																										roleName
																									}
																								</span>
																								<div
																									style={{
																										display:
																											"flex",
																										gap: "4px",
																										flexWrap:
																											"wrap",
																										justifyContent:
																											"flex-end",
																									}}
																								>
																									{accessTypes.map(
																										(
																											type,
																										) => (
																											<span
																												key={
																													type
																												}
																												style={permBadgeStyle(
																													type,
																												)}
																											>
																												{
																													type
																												}
																											</span>
																										),
																									)}
																								</div>
																							</div>
																						),
																					)
																				) : (
																					<div
																						style={{
																							color: "#999",
																							fontStyle:
																								"italic",
																							fontSize:
																								"13px",
																						}}
																					>
																						No
																						permissions
																						assigned
																						to
																						this
																						asset
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Summary Section */}
																		<div
																			style={{
																				...factorCardStyle,
																				gridColumn:
																					"1 / -1",
																			}}
																		>
																			<div
																				style={factorHeaderStyle(
																					"#dc3545",
																				)}
																			>
																				🎯
																				How
																				Final
																				Score
																				Is
																				Built
																			</div>
																			<div
																				style={
																					factorContentStyle
																				}
																			>
																				<div
																					style={{
																						fontSize:
																							"14px",
																						lineHeight:
																							"1.8",
																					}}
																				>
																					<div
																						style={
																							metricRowStyle
																						}
																					>
																						<span>
																							Base
																							risk
																							from
																							sensitivity
																							+
																							PII:
																						</span>
																						<strong>
																							{parseFloat(
																								asset
																									.riskBreakdown
																									?.sensitivityContribution ||
																									0,
																							) +
																								parseFloat(
																									asset
																										.riskBreakdown
																										?.piiBaseScore ||
																										0,
																								) +
																								parseFloat(
																									asset
																										.riskBreakdown
																										?.piiCountBonus ||
																										0,
																								) +
																								parseFloat(
																									asset
																										.riskBreakdown
																										?.criticalPiiBonus ||
																										0,
																								)}{" "}
																							pts
																						</strong>
																					</div>
																					<div
																						style={
																							metricRowStyle
																						}
																					>
																						<span>
																							+
																							Access
																							scope
																							impact
																							(25%):
																						</span>
																						<strong>
																							+
																							{
																								asset
																									.riskBreakdown
																									?.permissionContribution
																							}{" "}
																							pts
																						</strong>
																					</div>
																					<div
																						style={
																							metricRowStyle
																						}
																					>
																						<span>
																							+
																							Usage
																							activity
																							impact
																							(10%):
																						</span>
																						<strong>
																							+
																							{
																								asset
																									.riskBreakdown
																									?.auditContribution
																							}{" "}
																							pts
																						</strong>
																					</div>
																					<div
																						style={
																							metricRowStyle
																						}
																					>
																						<span>
																							-
																							Protection
																							controls
																							impact
																							(30%):
																						</span>
																						<strong
																							style={{
																								color: "#28a745",
																							}}
																						>
																							-
																							{
																								asset
																									.riskBreakdown
																									?.securityReduction
																							}{" "}
																							pts
																						</strong>
																					</div>
																					<hr
																						style={{
																							margin: "10px 0",
																							border: "none",
																							borderTop:
																								"2px solid #dee2e6",
																						}}
																					/>
																					<div
																						style={{
																							...metricRowStyle,
																							fontSize:
																								"16px",
																							fontWeight:
																								"bold",
																						}}
																					>
																						<span>
																							Final
																							Risk
																							Score:
																						</span>
																						<strong
																							style={{
																								color: getRiskLevelColor(
																									asset.riskLevel,
																								),
																							}}
																						>
																							{
																								asset.riskScore
																							}

																							%
																							(
																							{
																								asset.riskLevel
																							}

																							)
																						</strong>
																					</div>
																				</div>
																			</div>
																		</div>
																	</div>
																</div>
															</td>
														</tr>
													)}
												</>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

// Styles
const errorStyle = {
	padding: "12px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
	marginBottom: "16px",
};

const tableStyle = {
	width: "100%",
	borderCollapse: "collapse",
	fontSize: "14px",
};

const headerCellStyle = {
	padding: "12px",
	textAlign: "left",
	fontWeight: "600",
	borderBottom: "2px solid #dee2e6",
	whiteSpace: "nowrap",
};

const cellStyle = {
	padding: "12px",
	borderBottom: "1px solid #dee2e6",
};

const rowStyle = {
	transition: "background-color 0.2s",
	cursor: "pointer",
};

const riskBadgeStyle = {
	padding: "4px 12px",
	borderRadius: "12px",
	color: "white",
	fontWeight: "600",
	fontSize: "12px",
	display: "inline-block",
};

const detailButtonStyle = {
	padding: "6px 12px",
	backgroundColor: "#007bff",
	color: "white",
	border: "none",
	borderRadius: "4px",
	cursor: "pointer",
	fontSize: "12px",
	fontWeight: "500",
};

const expandedCellStyle = {
	padding: "0",
	backgroundColor: "#f8f9fa",
	borderBottom: "2px solid #dee2e6",
};

const breakdownContainerStyle = {
	padding: "20px",
};

const breakdownGridStyle = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
	gap: "15px",
	marginTop: "15px",
};

const factorCardStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	overflow: "hidden",
	boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const factorHeaderStyle = (bgColor) => ({
	padding: "10px 15px",
	backgroundColor: bgColor,
	color: "white",
	fontWeight: "600",
	fontSize: "14px",
});

const factorContentStyle = {
	padding: "15px",
};

const metricRowStyle = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: "6px 0",
	fontSize: "13px",
};

const categoryTagStyle = {
	display: "inline-block",
	padding: "2px 8px",
	margin: "2px",
	backgroundColor: "#e9ecef",
	borderRadius: "10px",
	fontSize: "11px",
	color: "#495057",
};

const PERM_BADGE_COLORS = {
	READ: { bg: "#d1fae5", text: "#065f46" },
	WRITE: { bg: "#dbeafe", text: "#1e40af" },
	UPDATE: { bg: "#fef3c7", text: "#92400e" },
	DELETE: { bg: "#fee2e2", text: "#991b1b" },
};

const permBadgeStyle = (accessType) => {
	const c = PERM_BADGE_COLORS[accessType] || {
		bg: "#e5e7eb",
		text: "#374151",
	};
	return {
		display: "inline-block",
		padding: "2px 8px",
		borderRadius: "10px",
		fontSize: "11px",
		fontWeight: "600",
		backgroundColor: c.bg,
		color: c.text,
	};
};
