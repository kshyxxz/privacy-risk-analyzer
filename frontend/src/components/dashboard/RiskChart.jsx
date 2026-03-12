export default function RiskChart({ data = {} }) {
	const RISK_SEGMENTS = [
		{ key: "extremeRisk", label: "Extreme", icon: "⛔", color: "#7f1d1d" },
		{
			key: "criticalRisk",
			label: "Critical",
			icon: "🚨",
			color: "#dc2626",
		},
		{ key: "highRisk", label: "High", icon: "🔴", color: "#ef4444" },
		{
			key: "moderateRisk",
			label: "Moderate",
			icon: "🟠",
			color: "#f59e0b",
		},
		{ key: "lowRisk", label: "Low", icon: "🟡", color: "#84cc16" },
		{ key: "minimalRisk", label: "Minimal", icon: "✅", color: "#16a34a" },
	];

	const totalCount = RISK_SEGMENTS.reduce(
		(sum, segment) => sum + (data[segment.key] || 0),
		0,
	);
	const total = totalCount || 1;

	return (
		<div
			style={{
				backgroundColor: "white",
				borderRadius: "8px",
				padding: "20px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				display: "flex",
				flexDirection: "column",
				minHeight: "0",
			}}
		>
			<h3 style={{ marginTop: 0, marginBottom: "20px" }}>
				Risk Distribution
			</h3>
			<div
				style={{
					display: "flex",
					gap: "40px",
					alignItems: "center",
					flex: 1,
				}}
			>
				<div style={{ flex: 1 }}>
					{RISK_SEGMENTS.map((segment, index) => {
						const value = data[segment.key] || 0;
						const width = (value / total) * 100;

						return (
							<div
								key={segment.key}
								style={{
									marginBottom:
										index === RISK_SEGMENTS.length - 1
											? "0"
											: "16px",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: "8px",
										alignItems: "center",
									}}
								>
									<label
										style={{
											color: "#333",
											fontWeight: "500",
										}}
									>
										{segment.icon} {segment.label}
									</label>
									<span
										style={{
											color: segment.color,
											fontWeight: "bold",
										}}
									>
										{value}
									</span>
								</div>
								<div
									style={{
										width: "100%",
										height: "10px",
										backgroundColor: "#eee",
										borderRadius: "5px",
										overflow: "hidden",
									}}
								>
									<div
										style={{
											width: `${width}%`,
											height: "100%",
											backgroundColor: segment.color,
											transition: "width 0.3s ease",
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>

				<div
					style={{
						textAlign: "center",
						minWidth: "120px",
					}}
				>
					<div
						style={{
							fontSize: "36px",
							fontWeight: "bold",
							color: "#333",
							marginBottom: "8px",
						}}
					>
						{totalCount}
					</div>
					<div style={{ fontSize: "12px", color: "#888" }}>
						Total Assets
					</div>
				</div>
			</div>
		</div>
	);
}
