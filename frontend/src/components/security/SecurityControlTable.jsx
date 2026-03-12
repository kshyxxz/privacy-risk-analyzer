import React from "react";

const SecurityControlTable = ({ controls }) => {
	return (
		<div style={{ marginTop: "30px" }}>
			<h2 style={{ marginBottom: "15px" }}>Applied Security Controls</h2>
			<div style={tableContainerStyle}>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
					}}
				>
					<thead>
						<tr style={{ backgroundColor: "#f8f9fa" }}>
							<th style={cellHeaderStyle}>Asset</th>
							<th style={cellHeaderStyle}>Encryption</th>
							<th style={cellHeaderStyle}>Encoding</th>
							<th style={cellHeaderStyle}>Hashing</th>
							<th style={cellHeaderStyle}>Last Updated</th>
						</tr>
					</thead>
					<tbody>
						{controls.map((control) => (
							<tr key={control.control_id}>
								<td style={cellBodyStyle}>
									{control.asset_name}
								</td>
								<td style={cellBodyStyle}>
									{control.encryption ? "✅" : "❌"}
								</td>
								<td style={cellBodyStyle}>
									{control.masking ? "✅" : "❌"}
								</td>
								<td style={cellBodyStyle}>
									{control.hashing ? "✅" : "❌"}
								</td>
								<td style={cellBodyStyle}>
									{control.last_updated ||
										(control.updated_at
											? new Date(
													control.updated_at,
												).toLocaleString()
											: "-")}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const tableContainerStyle = {
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
	overflowX: "auto",
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

export default SecurityControlTable;
