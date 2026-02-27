import React from "react";

const AuditTable = ({ logs }) => {
	return (
		<table border="1">
			<thead>
				<tr>
					<th>User</th>
					<th>Asset</th>
					<th>Action</th>
					<th>Timestamp</th>
				</tr>
			</thead>
			<tbody>
				{logs.map((log) => (
					<tr key={log.log_id}>
						<td>{log.username}</td>
						<td>{log.asset_name}</td>
						<td>{log.action}</td>
						<td>{new Date(log.timestamp).toLocaleString()}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default AuditTable;
