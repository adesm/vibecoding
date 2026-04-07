import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoutes } from "./routes/users-route";

export const app = new Elysia()
	.use(
		swagger({
			path: "/swagger",
			documentation: {
				info: {
					title: "Vibecoding API Documentation",
					version: "1.0.0",
					description: "API Endpoints for user authentication (Register, Login, Profile, Logout).",
				},
				tags: [{ name: "Authentication", description: "User Authentication endpoints" }],
			},
		})
	)
	.use(usersRoutes)
	.get("/", () => "Hello Elysia");

if (import.meta.main) {
	app.listen(3000);
	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
	);
}
