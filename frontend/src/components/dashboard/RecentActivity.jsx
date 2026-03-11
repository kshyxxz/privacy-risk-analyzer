export default function RecentActivity({ activities = [] }) {
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
				Recent Activity
			</h3>
			{activities.length === 0 ? (
				<p style={{ color: "#888", textAlign: "center" }}>
					No recent activity
				</p>
			) : (
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						display: "flex",
						flexDirection: "column",
						minHeight: "0",
					}}
				>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							flex: 1,
						}}
					>
						<thead>
							<tr
								style={{
									borderBottom: "2px solid #eee",
									textAlign: "left",
								}}
							>
								<th
									style={{
										padding: "10px",
										color: "#666",
										fontWeight: "600",
										fontSize: "14px",
									}}
								>
									User
								</th>
								<th
									style={{
										padding: "10px",
										color: "#666",
										fontWeight: "600",
										fontSize: "14px",
									}}
								>
									Action
								</th>
								<th
									style={{
										padding: "10px",
										color: "#666",
										fontWeight: "600",
										fontSize: "14px",
									}}
								>
									Timestamp
								</th>
							</tr>
						</thead>
						<tbody>
							{activities.map((activity, index) => (
								<tr
									key={index}
									style={{
										borderBottom: "1px solid #eee",
									}}
								>
									<td
										style={{
											padding: "10px",
											color: "#333",
										}}
									>
										{activity.username}
									</td>
									<td
										style={{
											padding: "10px",
											color: "#333",
										}}
									>
										{activity.action}
									</td>
									<td
										style={{
											padding: "10px",
											color: "#888",
											fontSize: "12px",
										}}
									>
										{new Date(
											activity.timestamp,
										).toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
