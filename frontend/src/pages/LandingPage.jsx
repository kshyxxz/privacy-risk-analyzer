import { useState } from "react";
import Login from "../pages/Login";
import Register from "../pages/Register";

export default function LandingPage() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	return (
		<div>
			<h1>Privacy Risk Analyzer</h1>
		</div>
	);
}
