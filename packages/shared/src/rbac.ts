export const MembershipRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  AUDITOR: "AUDITOR",
} as const;

export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

const roleRank: Record<MembershipRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  AUDITOR: 1,
};

export function hasAtLeastRole(userRole: MembershipRole, requiredRole: MembershipRole) {
  return roleRank[userRole] >= roleRank[requiredRole];
}


