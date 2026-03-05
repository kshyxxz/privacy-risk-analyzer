import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
	const { user, logout } = useContext(AuthContext);
	const navigate = useNavigate();
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
				backgroundColor: "#333",
				color: "white",
				padding: "0 20px",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
			}}
		>
			<div style={{ fontSize: "20px", fontWeight: "bold" }}>
				Privacy Risk Analyzer
			</div>

			<ul
				style={{
					display: "flex",
					listStyle: "none",
					margin: 0,
					padding: 0,
					gap: "20px",
					flex: 1,
					justifyContent: "center",
				}}
			>
				{navItems.map((item) => (
					<li key={item.path}>
						<Link
							to={item.path}
							style={{
								color: "white",
								textDecoration: "none",
								padding: "10px 15px",
								borderRadius: "4px",
								transition: "background-color 0.2s",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor =
									"rgba(255,255,255,0.1)")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor =
									"transparent")
							}
						>
							{item.label}
						</Link>
					</li>
				))}
			</ul>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "15px",
				}}
			>
				<span style={{ fontSize: "14px" }}>
					{user?.username} ({role})
				</span>
				<button
					onClick={handleLogout}
					style={{
						padding: "8px 16px",
						backgroundColor: "#dc3545",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						transition: "background-color 0.2s",
					}}
					onMouseEnter={(e) =>
						(e.currentTarget.style.backgroundColor = "#c82333")
					}
					onMouseLeave={(e) =>
						(e.currentTarget.style.backgroundColor = "#dc3545")
					}
				>
					Logout
				</button>
			</div>
		</nav>
	);
}
