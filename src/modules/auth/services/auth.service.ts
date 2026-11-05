import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";
import { RegisterDTO, LoginDTO, UserPayload } from "../types/auth.types";

export class AuthService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  async register(data: RegisterDTO): Promise<UserPayload> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async login(data: LoginDTO): Promise<UserPayload> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("E-mail ou senha inválidos.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getProfile(userId: string): Promise<UserPayload> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
