// src/utils/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash una password con bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verifica se una password corrisponde all'hash
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};