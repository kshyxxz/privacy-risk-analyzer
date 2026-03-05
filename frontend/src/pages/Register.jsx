export default function Register() {
	return (
		<div>
			<h1>Register Page</h1>
			<div>
				<input type="text" name="username" placeholder="Username" />
				<input type="email" name="email" placeholder="Email" />
				<input type="password" name="password" placeholder="Password" />
				<button type="submit">Register</button>
			</div>
		</div>
	);
}
