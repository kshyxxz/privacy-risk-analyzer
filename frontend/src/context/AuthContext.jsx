import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(
		() => JSON.parse(localStorage.getItem("user")) || null,
	);
	const [token, setToken] = useState(
		() => localStorage.getItem("token") || null,
	);

	const login = (userData, authToken) => {
		localStorage.setItem("user", JSON.stringify(userData));
		if (authToken) {
			localStorage.setItem("token", authToken);
		} else {
			localStorage.removeItem("token");
		}
		if (userData.role) {
			localStorage.setItem("role", userData.role);
		}
		setUser(userData);
		setToken(authToken || null);
	};

	const logout = () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("role");
		setUser(null);
		setToken(null);
	};

	return (
		<AuthContext.Provider value={{ user, token, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
