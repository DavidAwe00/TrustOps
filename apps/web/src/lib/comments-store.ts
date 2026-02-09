// In-memory store for evidence comments (demo mode)
type Comment = {
  id: string;
  evidenceId: string;
  content: string;
  author: { name: string; email: string };
  createdAt: string;
};

const commentsStore: Map<string, Comment[]> = new Map();

export function getCommentsForEvidence(evidenceId: string): Comment[] {
  return commentsStore.get(evidenceId) || [];
}

export function addCommentToEvidence(evidenceId: string, comment: Comment): void {
  const existing = commentsStore.get(evidenceId) || [];
  commentsStore.set(evidenceId, [...existing, comment]);
}

export function clearCommentsForEvidence(evidenceId: string): void {
  commentsStore.delete(evidenceId);
}
