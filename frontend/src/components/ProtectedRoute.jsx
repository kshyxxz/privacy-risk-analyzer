import { useContext } from "react";

export default function ProtectedRoute({ children }) {
	const { user } = useContext(AuthContext);
	if (!user) {
		return <div>Please login to access this page.</div>;
	}
	return children;
}
