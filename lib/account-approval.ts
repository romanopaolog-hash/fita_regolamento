export type AccountApprovalStatus = 'approved' | 'pending' | 'rejected';

// Accounts created before access approval was enabled keep their existing access.
export const APPROVAL_REQUIRED_AFTER = Date.parse('2026-11-09T10:42:28.000Z');

type ApprovalUser = {
  createdAt: number | Date | null;
  publicMetadata?: Record<string, unknown>;
};

export function getAccountApprovalStatus(user: ApprovalUser): AccountApprovalStatus {
  const metadata = user.publicMetadata ?? {};
  const createdAt = user.createdAt instanceof Date
    ? user.createdAt.getTime()
    : typeof user.createdAt === 'number'
      ? user.createdAt
      : 0;

  if (metadata.role === 'admin' || metadata.approvalStatus === 'approved') return 'approved';
  if (metadata.approvalStatus === 'rejected') return 'rejected';
  if (metadata.approvalStatus === 'pending' || createdAt >= APPROVAL_REQUIRED_AFTER) return 'pending';

  return 'approved';
}

export function isAccountApproved(user: ApprovalUser): boolean {
  return getAccountApprovalStatus(user) === 'approved';
}
