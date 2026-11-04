export type BlockPath = readonly (string | number)[];

export type BlockOp =
	// On an array, push the value. On a string, concatenate the value.
	{ op: 'append'; path: BlockPath; value: unknown } | { op: 'set'; path: BlockPath; value: unknown };

/** Applies the ops of one delta to `blocks`, in place and in order. */
export function applyBlockOps(blocks: unknown[], ops: readonly BlockOp[]): void;

/** Folds the ops that one window collected into fewer ops with the same effect on `blocks`. */
export function coalesceOps(blocks: unknown[], ops: readonly BlockOp[]): BlockOp[];

/** Sets the open task of the plan to its final status. The `end` delta carries no ops, so each side does this itself. */
export function closeOpenTask(blocks: unknown[], reason: 'done' | 'stopped' | 'error'): void;
