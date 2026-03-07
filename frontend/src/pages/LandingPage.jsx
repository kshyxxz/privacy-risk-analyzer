import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function LandingPage() {
	const { user } = useContext(AuthContext);

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "#f5f5f5",
				padding: "20px",
			}}
		>
			<div
				style={{
					maxWidth: "800px",
					textAlign: "center",
				}}
			>
				<h1
					style={{
						fontSize: "48px",
						marginBottom: "20px",
						color: "#333",
					}}
				>
					Privacy Risk Analyzer
				</h1>
				<p
					style={{
						fontSize: "18px",
						color: "#666",
						marginBottom: "30px",
						lineHeight: "1.6",
					}}
				>
					Comprehensive platform for identifying, analyzing, and
					managing personally identifiable information (PII) across
					your data assets. Ensure compliance and minimize privacy
					risks with our powerful tools.
				</p>

				<div
					style={{
						display: "flex",
						gap: "20px",
						justifyContent: "center",
						marginBottom: "40px",
					}}
				>
					<a
						href="/login"
						style={{
							padding: "12px 30px",
							fontSize: "16px",
							backgroundColor: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "5px",
							cursor: "pointer",
							textDecoration: "none",
							display: "inline-block",
						}}
					>
						Login
					</a>
				</div>

				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(auto-fit, minmax(250px, 1fr))",
						gap: "20px",
						marginTop: "50px",
					}}
				>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>🔍 Identify PII</h3>
						<p>
							Automatically detect and classify personally
							identifiable information in your databases.
						</p>
					</div>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>📊 Analyze Risk</h3>
						<p>
							Assess and quantify privacy risks across your data
							assets with comprehensive analytics.
						</p>
					</div>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>🛡️ Manage Access</h3>
						<p>
							Control user permissions and access to sensitive
							data with granular permission controls.
						</p>
					</div>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>📋 Audit Logs</h3>
						<p>
							Track and monitor all activities related to
							sensitive data access and modifications.
						</p>
					</div>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>🔐 Security Controls</h3>
						<p>
							Implement and manage security controls to protect
							sensitive information effectively.
						</p>
					</div>
					<div
						style={{
							padding: "20px",
							backgroundColor: "white",
							borderRadius: "8px",
							boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
						}}
					>
						<h3>✅ Compliance</h3>
						<p>
							Ensure compliance with GDPR, CCPA, and other privacy
							regulations.
						</p>
					</div>
				</div>
			</div>

			<footer
				style={{
					marginTop: "50px",
					padding: "20px",
					color: "#999",
					fontSize: "14px",
				}}
			>
				<p>© 2026 Privacy Risk Analyzer. All rights reserved.</p>
			</footer>
		</div>
	);
}
