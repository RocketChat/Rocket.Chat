import type { ASTNode } from './definitions';

export const isNodeOfType = <N extends ASTNode>(
  value: unknown,
  type: N['type']
): value is N =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as { type: unknown }).type === type;
