import { Elysia } from "elysia";
import { usersRoutes } from "./routes/users-route";

const app = new Elysia()
	.use(usersRoutes)
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
