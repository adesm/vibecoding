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
	.group("/", (app) =>
		app
			.derive(({ headers: { authorization } }) => {
				if (!authorization || !authorization.startsWith("Bearer ")) {
					return { token: null };
				}
				return { token: authorization.substring(7) };
			})
			.onBeforeHandle(({ token, set }) => {
				if (!token) {
					set.status = 401;
					return { error: "unauthorized" };
				}
			})
			.get("/current", async ({ token, set }) => {
				try {
					const result = await UserService.getCurrentUser(token!);
					return result;
				} catch (error: any) {
					set.status = 401;
					return { error: error.message };
				}
			})
			.delete("/logout", async ({ token, set }) => {
				try {
					const result = await UserService.logoutUser(token!);
					return result;
				} catch (error: any) {
					set.status = 401;
					return { error: error.message };
				}
			})
	);
