import { useState } from "react";

export default function AuthContext() {
	const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem("user")) || null);
	const login = (userData) => {
		localStorage.setItem("user", JSON.stringify(userData));
		setUser(userData);
	};
	const logout = () => {
		localStorage.removeItem("user");
		setUser(null);
	}
	return <div>AuthContext</div>;
}
