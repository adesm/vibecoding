import { Elysia, t } from "elysia";
import { UserService } from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: "/api/users" })
	.post(
		"/",
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
	)
	.post(
		"/login",
		async ({ body, set }) => {
			try {
				const result = await UserService.loginUser(body);
				return result;
			} catch (error: any) {
				set.status = 401;
				return { error: error.message };
			}
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String(),
			}),
		}
	)
	.get("/current", async ({ headers: { authorization }, set }) => {
		if (!authorization || !authorization.startsWith("Bearer ")) {
			set.status = 401;
			return { error: "unauthorized" };
		}

		try {
			const token = authorization.substring(7);
			const result = await UserService.getCurrentUser(token);
			return result;
		} catch (error: any) {
			set.status = 401;
			return { error: error.message };
		}
	});
