import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import AuditFilter from "../../components/audit/AuditFilter";
import AuditTable from "../../components/audit/AuditTable";
import { getAuditLogs } from "../../services/auditService";

const AuditLogs = () => {
	const [logs, setLogs] = useState([]);
	const [filters, setFilters] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setError("");
				const res = await getAuditLogs(filters);
				setLogs(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				console.error("Failed to load audit logs:", err);
				setError("Unable to load audit logs right now.");
				setLogs([]);
			} finally {
				setLoading(false);
			}
		})();
	}, [filters]);

	return (
		<div>
			<Navbar />
			<div
				style={{
					padding: "30px 20px",
					maxWidth: "1200px",
					margin: "0 auto",
					backgroundColor: "#f5f5f5",
					minHeight: "calc(100vh - 60px)",
				}}
			>
				<h1 style={{ marginTop: 0, marginBottom: "20px" }}>
					Audit Logs
				</h1>

				<AuditFilter setFilters={setFilters} />

				{loading && (
					<div style={{ color: "#666" }}>Loading audit logs...</div>
				)}

				{!loading && error && <div style={errorStyle}>{error}</div>}

				{!loading && !error && logs.length === 0 && (
					<div style={{ color: "#666", marginTop: "20px" }}>
						No audit logs found.
					</div>
				)}

				{!loading && !error && logs.length > 0 && (
					<AuditTable logs={logs} />
				)}
			</div>
		</div>
	);
};

const errorStyle = {
	padding: "12px",
	backgroundColor: "#ffe6e6",
	color: "#b00020",
	borderRadius: "6px",
	marginBottom: "16px",
};

export default AuditLogs;
