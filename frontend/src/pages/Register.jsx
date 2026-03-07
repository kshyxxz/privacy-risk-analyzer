import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";

export default function Register() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState("Analyst");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [adminExists, setAdminExists] = useState(false);
	const navigate = useNavigate();
	const { login } = useContext(AuthContext);

	useEffect(() => {
		const checkAdminExists = async () => {
			try {
				const adminCheckRes = await api.get("/auth/check-admin-exists");
				setAdminExists(adminCheckRes.data.exists);
			} catch (err) {
				console.error("Failed to check admin status:", err);
				setAdminExists(false);
			}
		};

		checkAdminExists();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			const response = await api.post("/auth/register", {
				username,
				email,
				password,
				role,
			});

			if (response.status === 201) {
				login(response.data.user, response.data.token);
				navigate("/dashboard");
			}
		} catch (err) {
			setError(
				err.response?.data?.error ||
					"Registration failed. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: "400px", margin: "50px auto" }}>
			<h1>Register</h1>
			{error && <p style={{ color: "red" }}>{error}</p>}
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: "15px" }}>
					<label>Username:</label>
					<input
						type="text"
						placeholder="Choose a username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						style={{ width: "100%", padding: "8px" }}
					/>
				</div>
				<div style={{ marginBottom: "15px" }}>
					<label>Email:</label>
					<input
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{ width: "100%", padding: "8px" }}
					/>
				</div>
				<div style={{ marginBottom: "15px" }}>
					<label>Role:</label>
					<select
						value={role}
						onChange={(e) => setRole(e.target.value)}
						required
						style={{ width: "100%", padding: "8px" }}
					>
						<option value="Analyst">Analyst</option>
						{!adminExists && <option value="Admin">Admin</option>}
						<option value="Intern">Intern</option>
					</select>
					{adminExists && (
						<p
							style={{
								fontSize: "12px",
								color: "#666",
								marginTop: "5px",
							}}
						>
							Admin role is already assigned to another user.
						</p>
					)}
				</div>
				<div style={{ marginBottom: "15px" }}>
					<label>Password:</label>
					<input
						type="password"
						placeholder="Create a password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{ width: "100%", padding: "8px" }}
					/>
				</div>
				<div style={{ marginBottom: "15px" }}>
					<label>Confirm Password:</label>
					<input
						type="password"
						placeholder="Confirm your password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						style={{ width: "100%", padding: "8px" }}
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					style={{ width: "100%", padding: "10px" }}
				>
					{loading ? "Registering..." : "Register"}
				</button>
			</form>
			<p>
				Already have an account? <a href="/login">Login here</a>
			</p>
		</div>
	);
}
