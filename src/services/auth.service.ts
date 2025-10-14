// src/services/auth.service.ts
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from './token.service';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

/**
 * Registra un nuovo utente
 */
export const register = async (data: RegisterData) => {
  const { name, email, password } = data;

  // Verifica se email già esiste
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Email già registrata');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Crea utente
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true
    }
  });

  // Genera token
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  return { user, token };
};

/**
 * Login utente
 */
export const login = async (data: LoginData) => {
  const { email, password } = data;

  // Trova utente
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Email o password errati');
  }

  // Verifica password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Email o password errati');
  }

  // Genera token
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  // Ritorna user senza password
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

/**
 * Ottieni profilo utente
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('Utente non trovato');
  }

  return user;
};