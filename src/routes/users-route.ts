import { Elysia, t } from "elysia";
import { UserService } from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: "/api" }).post(
	"/users",
	async ({ body, set }) => {
		try {
			const result = await UserService.registerUser(body);
			return result;
		} catch (error: any) {
			set.status = 400;
			return { error: error.message };
		}
	},
	{
		body: t.Object({
			name: t.String(),
			email: t.String({ format: "email" }),
			password: t.String(),
		}),
	}
);
