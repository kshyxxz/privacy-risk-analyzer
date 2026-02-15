import React from "react";

const SecurityControlTable = ({ controls }) => {
	return (
		<div>
			<h3>Applied Security Controls</h3>
			<table>
				<thead>
					<tr>
						<th>Asset</th>
						<th>Encryption</th>
						<th>Masking</th>
						<th>Hashing</th>
						<th>Last Updated</th>
					</tr>
				</thead>
				<tbody>
					{controls.map((control) => (
						<tr key={control.control_id}>
							<td>{control.asset_name}</td>
							<td>{control.encryption ? "✅" : "❌"}</td>
							<td>{control.masking ? "✅" : "❌"}</td>
							<td>{control.hashing ? "✅" : "❌"}</td>
							<td>{control.last_updated}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default SecurityControlTable;
