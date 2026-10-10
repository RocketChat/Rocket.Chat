import { buildOp } from './buildOp';
import type { CapturedEvent } from './buildOp';
import type { CollectionPolicy } from '../types';

const policy: CollectionPolicy = {
	name: 'rocketchat_message',
	counters: ['tcount'],
	sets: ['replies', 'reactions.*.usernames'],
	localFields: ['cache'],
	localIds: ['local-only'],
};

const update = (pre: object | undefined, post: object | undefined, updateDescription: CapturedEvent['updateDescription']) =>
	buildOp(policy, 'A', {
		operationType: 'update',
		id: 'm1',
		t: 1000,
		fullDocumentBeforeChange: pre ? { _id: 'm1', ...pre } : undefined,
		fullDocument: post ? { _id: 'm1', ...post } : undefined,
		updateDescription,
	});

describe('buildOp', () => {
	it('copies inserted documents without their local fields', () => {
		const op = buildOp(policy, 'A', {
			operationType: 'insert',
			id: 'm1',
			t: 1000,
			fullDocument: { _id: 'm1', msg: 'hi', cache: { x: 1 } },
		});
		expect(op).toEqual({ site: 'A', t: 1000, coll: 'rocketchat_message', id: 'm1', kind: 'insert', doc: { _id: 'm1', msg: 'hi' } });
	});

	it('ignores documents the policy keeps local', () => {
		expect(buildOp(policy, 'A', { operationType: 'delete', id: 'local-only', t: 1 })).toBeUndefined();
	});

	it('sends plain fields as values and removed fields as unsets', () => {
		const op = update({ msg: 'a', pinned: true }, { msg: 'b' }, { updatedFields: { msg: 'b' }, removedFields: ['pinned'] });
		expect(op?.set).toEqual([['msg', 'b']]);
		expect(op?.unset).toEqual(['pinned']);
	});

	it('sends counters as increments measured against the previous value', () => {
		const op = update({ tcount: 2 }, { tcount: 5 }, { updatedFields: { tcount: 5 } });
		expect(op?.inc).toEqual([['tcount', 3]]);
		expect(op?.set).toBeUndefined();
	});

	it('sends a reset counter as a negative increment', () => {
		const op = update({ tcount: 4 }, { tcount: 0 }, { updatedFields: { tcount: 0 } });
		expect(op?.inc).toEqual([['tcount', -4]]);
	});

	it('sends an appended set element as an addition', () => {
		const op = update({ replies: ['u1'] }, { replies: ['u1', 'u2'] }, { updatedFields: { 'replies.1': 'u2' } });
		expect(op?.add).toEqual([['replies', ['u2']]]);
		expect(op?.set).toBeUndefined();
	});

	it('sends a rewritten set as additions and removals', () => {
		const op = update({ replies: ['u1', 'u2'] }, { replies: ['u2', 'u3'] }, { updatedFields: { replies: ['u2', 'u3'] } });
		expect(op?.add).toEqual([['replies', ['u3']]]);
		expect(op?.pull).toEqual([['replies', ['u1']]]);
	});

	it('splits a new object that holds a set into the set addition', () => {
		const op = update(
			{ reactions: {} },
			{ reactions: { ':x:': { usernames: ['u1'] } } },
			{ updatedFields: { 'reactions.:x:': { usernames: ['u1'] } } },
		);
		expect(op?.add).toEqual([['reactions.:x:.usernames', ['u1']]]);
		expect(op?.set).toBeUndefined();
	});

	it('turns a removed object that holds a set into removals of its elements', () => {
		const op = update({ reactions: { ':x:': { usernames: ['u1'], note: 'n' } } }, { reactions: {} }, { removedFields: ['reactions.:x:'] });
		expect(op?.pull).toEqual([['reactions.:x:.usernames', ['u1']]]);
		expect(op?.unset).toEqual(['reactions.:x:.note']);
		expect(op?.prune).toEqual(['reactions.:x:']);
	});

	it('falls back to plain values when the pre-image is missing', () => {
		const op = update(undefined, { tcount: 5, replies: ['u1'] }, { updatedFields: { 'tcount': 5, 'replies.0': 'u1' } });
		expect(op?.set).toEqual([
			['tcount', 5],
			['replies', ['u1']],
		]);
	});

	it('returns nothing when only local fields changed', () => {
		expect(update({ cache: 1 }, { cache: 2 }, { updatedFields: { cache: 2 } })).toBeUndefined();
	});

	it('writes a truncated array whole instead of its elements', () => {
		const op = update(
			{ attachments: [1, 2, 3] },
			{ attachments: [9] },
			{ updatedFields: { 'attachments.0': 9 }, truncatedArrays: [{ field: 'attachments', newSize: 1 }] },
		);
		expect(op?.set).toEqual([['attachments', [9]]]);
	});

	it('diffs a replaced document field by field', () => {
		const op = buildOp(policy, 'A', {
			operationType: 'replace',
			id: 'm1',
			t: 1,
			fullDocumentBeforeChange: { _id: 'm1', msg: 'a', tcount: 1, gone: true, replies: ['u1'] },
			fullDocument: { _id: 'm1', msg: 'b', tcount: 2, replies: ['u1', 'u2'] },
		});
		expect(op?.set).toEqual([['msg', 'b']]);
		expect(op?.unset).toEqual(['gone']);
		expect(op?.inc).toEqual([['tcount', 1]]);
		expect(op?.add).toEqual([['replies', ['u2']]]);
	});
});
