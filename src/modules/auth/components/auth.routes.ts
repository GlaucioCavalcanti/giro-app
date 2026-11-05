import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthService } from "../services/auth.service";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // POST /api/auth/register
  fastify.post("/register", async (request, reply) => {
    const registerSchema = z.object({
      name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      email: z.string().email("E-mail inválido"),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    });

    const data = registerSchema.parse(request.body);

    try {
      const user = await authService.register(data);
      const token = fastify.jwt.sign({ id: user.id, email: user.email, name: user.name });
      return reply.status(201).send({ user, token });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || "Erro ao registrar usuário." });
    }
  });

  // POST /api/auth/login
  fastify.post("/login", async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email("E-mail inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    });

    const data = loginSchema.parse(request.body);

    try {
      const user = await authService.login(data);
      const token = fastify.jwt.sign({ id: user.id, email: user.email, name: user.name });
      return reply.send({ user, token });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message || "Credenciais inválidas." });
    }
  });

  // GET /api/auth/me
  fastify.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userPayload = request.user as { id: string; email: string; name: string };
      const user = await authService.getProfile(userPayload.id);
      return reply.send({ user });
    } catch (err) {
      return reply.status(401).send({ error: "Sessão inválida ou expirada." });
    }
  });
}
