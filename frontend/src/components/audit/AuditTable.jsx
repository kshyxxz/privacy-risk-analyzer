import React from "react";

const AuditTable = ({ logs }) => {
	return (
		<div style={tableContainerStyle}>
			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
				}}
			>
				<thead>
					<tr style={{ backgroundColor: "#f8f9fa" }}>
						<th style={cellHeaderStyle}>Log ID</th>
						<th style={cellHeaderStyle}>User</th>
						<th style={cellHeaderStyle}>Asset</th>
						<th style={cellHeaderStyle}>Action</th>
						<th style={cellHeaderStyle}>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					{logs.map((log) => (
						<tr key={log.log_id}>
							<td style={cellBodyStyle}>{log.log_id}</td>
							<td style={cellBodyStyle}>{log.username || "-"}</td>
							<td style={cellBodyStyle}>
								{!log.asset_name || log.asset_name === "-"
									? "All Assets"
									: log.asset_name}
							</td>
							<td style={cellBodyStyle}>{log.action}</td>
							<td style={cellBodyStyle}>
								{new Date(log.timestamp).toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

const tableContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	overflowX: "auto",
	marginTop: "20px",
};

const cellHeaderStyle = {
	textAlign: "left",
	padding: "12px",
	borderBottom: "1px solid #ddd",
	fontWeight: 600,
};

const cellBodyStyle = {
	padding: "12px",
	borderBottom: "1px solid #eee",
	fontSize: "14px",
};

export default AuditTable;
