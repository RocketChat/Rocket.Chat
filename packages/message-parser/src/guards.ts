import type { Types, TypesKeys } from './definitions.js';

export const isNodeOfType = <T extends TypesKeys>(value: unknown, type: T): value is Types[T] =>
	typeof value === 'object' && value !== null && 'type' in value && (value as { type: unknown }).type === type;
