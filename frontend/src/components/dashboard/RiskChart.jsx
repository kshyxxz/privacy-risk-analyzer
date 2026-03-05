export default function RiskChart({ data = {} }) {
	const { highRisk = 0, mediumRisk = 0, lowRisk = 0 } = data;
	const total = highRisk + mediumRisk + lowRisk || 1;

	const getRiskColor = (level) => {
		switch (level) {
			case "high":
				return "#dc3545";
			case "medium":
				return "#ffc107";
			case "low":
				return "#28a745";
			default:
				return "#6c757d";
		}
	};

	return (
		<div
			style={{
				backgroundColor: "white",
				borderRadius: "8px",
				padding: "20px",
				boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
			}}
		>
			<h3 style={{ marginTop: 0, marginBottom: "20px" }}>
				Risk Distribution
			</h3>
			<div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
				<div style={{ flex: 1 }}>
					<div style={{ marginBottom: "20px" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "8px",
								alignItems: "center",
							}}
						>
							<label style={{ color: "#333", fontWeight: "500" }}>
								🔴 High Risk
							</label>
							<span
								style={{ color: "#dc3545", fontWeight: "bold" }}
							>
								{highRisk}
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
									width: `${(highRisk / total) * 100}%`,
									height: "100%",
									backgroundColor: "#dc3545",
									transition: "width 0.3s ease",
								}}
							/>
						</div>
					</div>

					<div style={{ marginBottom: "20px" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "8px",
								alignItems: "center",
							}}
						>
							<label style={{ color: "#333", fontWeight: "500" }}>
								🟡 Medium Risk
							</label>
							<span
								style={{ color: "#ffc107", fontWeight: "bold" }}
							>
								{mediumRisk}
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
									width: `${(mediumRisk / total) * 100}%`,
									height: "100%",
									backgroundColor: "#ffc107",
									transition: "width 0.3s ease",
								}}
							/>
						</div>
					</div>

					<div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "8px",
								alignItems: "center",
							}}
						>
							<label style={{ color: "#333", fontWeight: "500" }}>
								🟢 Low Risk
							</label>
							<span
								style={{ color: "#28a745", fontWeight: "bold" }}
							>
								{lowRisk}
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
									width: `${(lowRisk / total) * 100}%`,
									height: "100%",
									backgroundColor: "#28a745",
									transition: "width 0.3s ease",
								}}
							/>
						</div>
					</div>
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
						{total}
					</div>
					<div style={{ fontSize: "12px", color: "#888" }}>
						Total Assets
					</div>
				</div>
			</div>
		</div>
	);
}
