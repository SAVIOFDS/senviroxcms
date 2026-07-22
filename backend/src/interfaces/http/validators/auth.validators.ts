import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const registerBodySchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
  fullName: z.string().trim().min(1).max(120),
  organizationId: z.string().trim().min(1).max(64).nullable().optional(),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(20).max(4096),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(20).max(4096),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(10).max(128),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
