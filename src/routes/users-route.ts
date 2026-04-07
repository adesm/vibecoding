import { Elysia, t } from "elysia";
import { UserService } from "../services/users-services";

const handleRouteError = (error: any, set: any) => {
	const message = error.message;
	const isBusinessError = [
		"email sudah terdaftar",
		"email atau password salah",
		"unauthorized",
	].includes(message);

	if (isBusinessError) {
		set.status = message === "unauthorized" ? 401 : 400;
		return { error: message };
	}

	console.error(error);
	set.status = 500;
	return { error: "Internal Server Error" };
};

export const usersRoutes = new Elysia({ prefix: "/api/users" })
	.post(
		"",
		async ({ body, set }) => {
			try {
				const result = await UserService.registerUser(body);
				return result;
			} catch (error: any) {
				return handleRouteError(error, set);
			}
		},
		{
			body: t.Object({
				name: t.String({ maxLength: 255 }),
				email: t.String({ format: "email", maxLength: 255 }),
				password: t.String({ maxLength: 255 }),
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
				return handleRouteError(error, set);
			}
		},
		{
			body: t.Object({
				email: t.String({ format: "email", maxLength: 255 }),
				password: t.String({ maxLength: 255 }),
			}),
		}
	)
	.group("", (app) =>
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
					return handleRouteError(error, set);
				}
			})
			.delete("/logout", async ({ token, set }) => {
				try {
					const result = await UserService.logoutUser(token!);
					return result;
				} catch (error: any) {
					return handleRouteError(error, set);
				}
			})
	);
