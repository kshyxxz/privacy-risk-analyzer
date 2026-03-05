import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(
		() => JSON.parse(localStorage.getItem("user")) || null,
	);

	const login = (userData) => {
		localStorage.setItem("user", JSON.stringify(userData));
		if (userData.role) {
			localStorage.setItem("role", userData.role);
		}
		setUser(userData);
	};

	const logout = () => {
		localStorage.removeItem("user");
		localStorage.removeItem("role");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
