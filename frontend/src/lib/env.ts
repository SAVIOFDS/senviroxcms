import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('SENVIROX'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:5000/api/v1'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional().default(''),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  if (!parsed.success) {
    throw new Error(`Invalid public environment: ${parsed.error.message}`);
  }

  return parsed.data;
}

export const publicEnv = readPublicEnv();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL.includes('your-project'),
  );
}
