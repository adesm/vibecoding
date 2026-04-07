import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users-route";

export const app = new Elysia()
	.use(usersRoutes)
	.get("/", () => "Hello Elysia");

if (import.meta.main) {
	app.listen(3000);
	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
	);
}
