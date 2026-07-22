export const USER_ROLES = ['super_admin', 'admin', 'manager', 'operator', 'viewer'] as const;

export type UserRole = (typeof USER_ROLES)[number];

const ROLE_RANK: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  operator: 40,
  viewer: 20,
};

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

/** Returns true if `actor` meets or exceeds `required` privilege. */
export function hasMinimumRole(actor: UserRole, required: UserRole): boolean {
  return ROLE_RANK[actor] >= ROLE_RANK[required];
}
