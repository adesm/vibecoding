import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const UserService = {
	/**
	 * Mendaftarkan akun pengguna baru (Registrasi).
	 * Fungsi ini bertugas mengecek ketersediaan email terlebih dahulu agar tidak terjadi duplikasi.
	 * Setelah divalidasi, ia akan membungkus (hash) password pengguna demi keamanan sebelum disimpan
	 * di dalam database tabel `users`.
	 */
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

	/**
	 * Autentikasi Pengguna (Login).
	 * Fungsi ini bertugas memverifikasi eksistensi alamat email dan mencocokkan password
	 * menggunakan algoritma bcrypt/argon2 native dari Bun. Jika sesuai, ia akan membuat sebuah UUID
	 * eksklusif untuk otorisasi akses (sesi) yang selanjutnya ditulis pada tabel `sessions`.
	 */
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

	/**
	 * Mendapatkan detail profil yang terafiliasi dengan token tertentu (Get Current Profile).
	 * Ia melakukan Inner Join (penggabungan query SQL) antara tabel `sessions` dan tabel `users`
	 * sehingga mampu mengambil kolom id, name, dan email tanpa menyertakan record password rentan.
	 */
	async getCurrentUser(token: string) {
		const [sessionWithUser] = await db
			.select({
				user: {
					id: users.id,
					name: users.name,
					email: users.email,
					createdAt: users.createdAt,
				},
			})
			.from(sessions)
			.innerJoin(users, eq(sessions.userId, users.id))
			.where(eq(sessions.token, token))
			.limit(1);

		if (!sessionWithUser) {
			throw new Error("unauthorized");
		}

		return {
			data: {
				...sessionWithUser.user,
				created_at: sessionWithUser.user.createdAt,
			},
		};
	},

	/**
	 * Pemberhentian Akses Token (Logout).
	 * Bertujuan untuk mencari token terkait di dalam tabel `sessions`,
	 * untuk kemudian menghapusnya secara permanen agar di lain waktu token tidak dapat digunakan masuk.
	 */
	async logoutUser(token: string) {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.token, token))
			.limit(1);

		if (!session) {
			throw new Error("unauthorized");
		}

		await db.delete(sessions).where(eq(sessions.token, token));
		return { data: "ok" };
	},
};
