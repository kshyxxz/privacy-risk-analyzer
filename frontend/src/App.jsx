import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PiiTypes from "./pages/PiiTypes";
import AddPiiType from "./pages/AddPiiType";
import EditPiiType from "./pages/EditPiiType";

import Permissions from "./pages/Permissions";
import AddPermission from "./pages/AddPermission";
import EditPermission from "./pages/EditPermission";

import AssignPiiToAsset from "./pages/AssignPiiToAsset";

import AuditLogs from "./pages/audit/AuditLogs";
import SecurityControl from "./pages/security/SecurityControl";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types"
						element={
							<ProtectedRoute>
								<PiiTypes />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types/add"
						element={
							<ProtectedRoute>
								<AddPiiType />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/pii-types/edit/:id"
						element={
							<ProtectedRoute>
								<EditPiiType />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions"
						element={
							<ProtectedRoute>
								<Permissions />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions/add"
						element={
							<ProtectedRoute>
								<AddPermission />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/permissions/edit/:id"
						element={
							<ProtectedRoute>
								<EditPermission />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/assign-pii"
						element={
							<ProtectedRoute>
								<AssignPiiToAsset />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/audit-logs"
						element={
							<ProtectedRoute>
								<AuditLogs />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/security-controls"
						element={
							<ProtectedRoute>
								<SecurityControl />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
