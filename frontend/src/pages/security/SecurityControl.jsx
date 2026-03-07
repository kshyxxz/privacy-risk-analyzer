import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import SecurityControlForm from "../../components/security/SecurityControlForm";
import SecurityControlTable from "../../components/security/SecurityControlTable";
import { getSecurityControls } from "../../services/securityService";

const SecurityControl = () => {
	const [controls, setControls] = useState([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	const fetchControls = async () => {
		try {
			setError("");
			const res = await getSecurityControls();
			setControls(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Failed to load security controls:", err);
			setError("Unable to load security controls right now.");
		}
	};

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				setError("");
				const res = await getSecurityControls();
				if (mounted)
					setControls(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				console.error("Failed to load security controls:", err);
				if (mounted) {
					setError("Unable to load security controls right now.");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

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
					Security Controls
				</h1>

				{error && <div style={errorStyle}>{error}</div>}

				<SecurityControlForm refreshData={fetchControls} />

				{loading && (
					<div style={{ color: "#666" }}>
						Loading security controls...
					</div>
				)}

				{!loading && !error && controls.length === 0 && (
					<div style={{ color: "#666", marginTop: "20px" }}>
						No security controls configured yet.
					</div>
				)}

				{!loading && controls.length > 0 && (
					<SecurityControlTable controls={controls} />
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

export default SecurityControl;
