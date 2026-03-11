import { useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
	const { user, logout } = useContext(AuthContext);
	const navigate = useNavigate();
	const location = useLocation();
	const role = localStorage.getItem("role") || user?.role;

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	// Define navigation items based on role
	const getNavItems = () => {
		const commonItems = [{ path: "/dashboard", label: "Dashboard" }];

		switch (role) {
			case "Admin":
				return [
					...commonItems,
					{ path: "/users", label: "Users" },
					{ path: "/assets", label: "Data Assets" },
					{ path: "/pii-types", label: "PII Types" },
					{ path: "/assign-pii", label: "Assign PII" },
					{ path: "/permissions", label: "Permissions" },
					{ path: "/security-controls", label: "Security Controls" },
					{ path: "/risk-analysis", label: "Risk Analysis" },
					{ path: "/audit-logs", label: "Audit Logs" },
				];
			case "Analyst":
				return [
					...commonItems,
					{ path: "/assets", label: "Assets" },
					{ path: "/risk-analysis", label: "Risk Analysis" },
					{ path: "/audit-logs", label: "Audit Logs" },
				];
			case "Intern":
				return [...commonItems, { path: "/assets", label: "Assets" }];
			default:
				return commonItems;
		}
	};

	const navItems = getNavItems();

	return (
		<nav
			style={{
				backgroundColor: "#2c3e50",
				color: "white",
				padding: "0 30px",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				fontFamily: '"IBM Plex Sans", sans-serif',
				position: "sticky",
				top: 0,
				zIndex: 1000,
			}}
		>
			<div
				style={{
					fontSize: "18px",
					fontWeight: "600",
					letterSpacing: "0.5px",
				}}
			>
				Privacy Risk Analyzer
			</div>

			<ul
				style={{
					display: "flex",
					listStyle: "none",
					margin: 0,
					padding: 0,
					gap: "5px",
					flex: 1,
					justifyContent: "center",
				}}
			>
				{navItems.map((item) => {
					const isActive = location.pathname === item.path;
					return (
						<li key={item.path}>
							<Link
								to={item.path}
								style={{
									color: "white",
									textDecoration: "none",
									padding: "12px 16px",
									borderRadius: "4px",
									transition: "background-color 0.2s ease",
									display: "block",
									fontSize: "14px",
									backgroundColor: isActive
										? "rgba(255,255,255,0.15)"
										: "transparent",
									borderBottom: isActive
										? "2px solid #3498db"
										: "2px solid transparent",
								}}
								onMouseEnter={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor =
											"rgba(255,255,255,0.1)";
									}
								}}
								onMouseLeave={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor =
											"transparent";
									}
								}}
							>
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "15px",
				}}
			>
				<span style={{ fontSize: "14px", opacity: 0.9 }}>
					{user?.username} ({role})
				</span>
				<button
					onClick={handleLogout}
					style={{
						padding: "8px 16px",
						backgroundColor: "#e74c3c",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "14px",
						transition: "background-color 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#c0392b";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "#e74c3c";
					}}
				>
					Logout
				</button>
			</div>
		</nav>
	);
}
