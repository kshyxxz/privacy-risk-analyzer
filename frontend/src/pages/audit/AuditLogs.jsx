import React, { useEffect, useState } from "react";
import AuditFilter from "../../components/audit/AuditFilter";
import AuditTable from "../../components/audit/AuditTable";
import { getAuditLogs } from "../../services/auditService";

const AuditLogs = () => {
	const [logs, setLogs] = useState([]);
	const [filters, setFilters] = useState({});

	useEffect(() => {
		(async () => {
			const res = await getAuditLogs(filters);
			setLogs(res.data);
		})();
	}, [filters]);

	return (
		<div className="audit-page">
			<h2>Audit Logs</h2>

			<AuditFilter setFilters={setFilters} />

			<AuditTable logs={logs} />
		</div>
	);
};

export default AuditLogs;
