import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const UserService = {
	async registerUser({ name, email, password }: any) {
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existingUser.length > 0) {
			throw new Error("email sudah terdaftar");
		}

		const hashedPassword = await Bun.password.hash(password);

		await db.insert(users).values({
			name,
			email,
			password: hashedPassword,
		});

		return { data: "OK" };
	},
};
