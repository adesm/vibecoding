import { db } from "../db";
import { users, sessions } from "../db/schema";
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

	async loginUser({ email, password }: any) {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			throw new Error("email atau password salah");
		}

		const isPasswordValid = await Bun.password.verify(password, user.password);

		if (!isPasswordValid) {
			throw new Error("email atau password salah");
		}

		const token = crypto.randomUUID();

		await db.insert(sessions).values({
			token,
			userId: user.id,
		});

		return { data: token };
	},
};
