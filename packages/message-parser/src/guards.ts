import type { ASTNode } from './definitions';

export const isNodeOfType = <T extends ASTNode['type']>(value: unknown, type: T): value is Extract<ASTNode, { type: T }> =>
	typeof value === 'object' && value !== null && 'type' in value && (value as { type: unknown }).type === type;
