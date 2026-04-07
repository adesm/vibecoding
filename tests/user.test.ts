import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

describe("User API", () => {
	it("should be using the test database", () => {
		console.log("Current Database URI:", process.env.DATABASE_URL);
		expect(process.env.DATABASE_URL).toContain("/vibecoding_test");
	});

	beforeEach(async () => {
		// Safety check: Don't run cleanup if not in test environment
		if (process.env.NODE_ENV !== "test") {
			throw new Error(
				"Critical: Database cleanup is only allowed in 'test' environment! Current: " +
					process.env.NODE_ENV
			);
		}

		// Clean the database before each test
		await db.delete(sessions);
		await db.delete(users);
	});

	describe("Registration (POST /api/users)", () => {
		it("should register a new user successfully", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "John Doe",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as any;
			expect(data).toEqual({ data: "OK" });
		});

		it("should fail if name is too long (> 255)", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "a".repeat(256),
						email: "long@example.com",
						password: "password123",
					}),
				})
			);

			expect(response.status).toBe(422); // Elysia validation error
		});

		it("should fail if email is already taken", async () => {
			// Register first user
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "User 1",
						email: "duplicate@example.com",
						password: "password123",
					}),
				})
			);

			// Try to register with same email
			const response = await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "User 2",
						email: "duplicate@example.com",
						password: "password456",
					}),
				})
			);

			expect(response.status).toBe(400);
			const data = (await response.json()) as any;
			expect(data.error).toBe("email sudah terdaftar");
		});
	});

	describe("Login (POST /api/users/login)", () => {
		beforeEach(async () => {
			// Pre-register a user for login tests
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Login User",
						email: "login@example.com",
						password: "password123",
					}),
				})
			);
		});

		it("should login successfully and return a token", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "login@example.com",
						password: "password123",
					}),
				})
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as any;
			expect(data.data).toBeDefined();
			expect(typeof data.data).toBe("string");
		});

		it("should fail with wrong password", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "login@example.com",
						password: "wrongpassword",
					}),
				})
			);

			expect(response.status).toBe(400);
			const data = (await response.json()) as any;
			expect(data.error).toBe("email atau password salah");
		});
	});

	describe("Current User (GET /api/users/current)", () => {
		let token: string;

		beforeEach(async () => {
			// Register and login to get a token
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Profile User",
						email: "profile@example.com",
						password: "password123",
					}),
				})
			);

			const loginRes = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "profile@example.com",
						password: "password123",
					}),
				})
			);
			const loginData = (await loginRes.json()) as any;
			token = loginData.data;
		});

		it("should get current profile with valid token", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as any;
			expect(data.data.email).toBe("profile@example.com");
			expect(data.data.name).toBe("Profile User");
		});

		it("should fail without authorization header", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
				})
			);

			expect(response.status).toBe(401);
		});
	});

	describe("Logout (DELETE /api/users/logout)", () => {
		let token: string;

		beforeEach(async () => {
			await app.handle(
				new Request("http://localhost/api/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Logout User",
						email: "logout@example.com",
						password: "password123",
					}),
				})
			);

			const loginRes = await app.handle(
				new Request("http://localhost/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: "logout@example.com",
						password: "password123",
					}),
				})
			);
			const loginData = (await loginRes.json()) as any;
			token = loginData.data;
		});

		it("should logout successfully and invalidate token", async () => {
			// Logout
			const logoutRes = await app.handle(
				new Request("http://localhost/api/users/logout", {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
			);
			expect(logoutRes.status).toBe(200);

			// Verify token is invalid
			const currentRes = await app.handle(
				new Request("http://localhost/api/users/current", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
			);
			expect(currentRes.status).toBe(401);
		});
	});
});
