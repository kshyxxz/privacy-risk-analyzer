import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axiosConfig";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useContext(AuthContext);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await api.post("/auth/login", {
				username,
				password,
			});

			if (response.status === 200) {
				login(response.data.user, response.data.token);
				navigate("/dashboard");
			}
		} catch (err) {
			setError(
				err.response?.data?.error || "Login failed. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: "400px", margin: "50px auto" }}>
			<h1>Login</h1>
			{error && <p style={{ color: "red" }}>{error}</p>}
			<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: "15px" }}>
					<label>Username:</label>
					<input
						type="text"
						placeholder="Enter your username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						style={{
							width: "100%",
							padding: "8px",
							boxSizing: "border-box",
						}}
					/>
				</div>
				<div style={{ marginBottom: "15px" }}>
					<label>Password:</label>
					<input
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={{
							width: "100%",
							padding: "8px",
							boxSizing: "border-box",
						}}
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					style={{
						width: "100%",
						padding: "10px",
						boxSizing: "border-box",
					}}
				>
					{loading ? "Logging in..." : "Login"}
				</button>
			</form>
			<p>
				Don't have an account? <a href="/register">Register here</a>
			</p>
		</div>
	);
}
