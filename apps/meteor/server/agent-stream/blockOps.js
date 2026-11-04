// Plain CommonJS with no imports, so the server and the Node harness in `agent-stream/` load the same file.
// The types are in `blockOps.d.ts`.
'use strict';

const at = (root, path) => path.reduce((node, key) => node[key], root);

const samePath = (a, b) => a.length === b.length && a.every((key, i) => key === b[i]);

// a value is copied in, so a later op on it never changes the delta that carried it
const copy = (value) => (typeof value === 'object' ? structuredClone(value) : value);

/** Applies the ops of one delta to `blocks`, in place and in order. */
const applyBlockOps = (blocks, ops) => {
	for (const { op, path, value } of ops) {
		const target = at(blocks, path);
		if (op === 'append' && Array.isArray(target)) {
			target.push(copy(value));
		} else if (op === 'append') {
			at(blocks, path.slice(0, -1))[path[path.length - 1]] = target + value;
		} else {
			at(blocks, path.slice(0, -1))[path[path.length - 1]] = copy(value);
		}
	}
};

/**
 * Folds the ops that one window collected into fewer ops with the same effect on `blocks`: text appends to one string
 * merge, and text appends into an item that an earlier `append` creates become part of that item.
 */
const coalesceOps = (blocks, ops) => {
	const out = [];
	for (const next of ops) {
		const prev = out[out.length - 1];
		if (prev?.op === 'append' && next.op === 'append' && typeof next.value === 'string') {
			if (typeof prev.value === 'string' && samePath(prev.path, next.path)) {
				out[out.length - 1] = { ...prev, value: prev.value + next.value };
				continue;
			}
			// the index of the item that `prev` creates, then the path from that item to the string
			const created = prev.path;
			const index = at(blocks, created).length + out.filter((o) => o.op === 'append' && samePath(o.path, created)).length - 1;
			const inside = next.path.slice(created.length + 1);
			if (typeof prev.value === 'object' && next.path[created.length] === index && samePath(next.path.slice(0, created.length), created)) {
				const holder = at(prev.value, inside.slice(0, -1));
				const key = inside[inside.length - 1];
				if (typeof holder?.[key] === 'string') {
					holder[key] += next.value;
					continue;
				}
			}
		}
		// the op is stored as given, so a fold below never changes the caller's value
		out.push(next.op === 'append' && typeof next.value === 'object' ? { ...next, value: structuredClone(next.value) } : next);
	}
	return out;
};

/** Sets the open task of the plan to its final status. The `end` delta carries no ops, so each side does this itself. */
const closeOpenTask = (blocks, reason) => {
	const plan = blocks.find((block) => block.type === 'plan');
	const task = plan?.tasks[plan.tasks.length - 1];
	if (task?.status === 'in_progress') {
		task.status = reason === 'error' ? 'error' : 'complete';
	}
};

exports.applyBlockOps = applyBlockOps;
exports.coalesceOps = coalesceOps;
exports.closeOpenTask = closeOpenTask;
