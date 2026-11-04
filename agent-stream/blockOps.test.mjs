// usage: node --test agent-stream/blockOps.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyBlockOps, closeOpenTask, coalesceOps } from '../apps/meteor/server/agent-stream/blockOps.js';

const placeholder = () => [
	{ type: 'alert', text: { type: 'plain_text', text: 'working' } },
	{ type: 'plan', title: 'Plan', tasks: [{ task_id: 'step-0', title: 'Read', status: 'in_progress' }] },
];
const details = (text) => ({ type: 'rich_text', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text }] }] });
const TEXT = ['details', 'elements', 0, 'elements', 0, 'text'];

// a thinking task, two text appends, a tool call, then the output section with two text appends
const ops = [
	{ op: 'set', path: [1, 'tasks', 0, 'status'], value: 'complete' },
	{ op: 'append', path: [1, 'tasks'], value: { task_id: 'step-1', title: 'Thinking', status: 'in_progress', details: details('') } },
	{ op: 'append', path: [1, 'tasks', 1, ...TEXT], value: 'ab' },
	{ op: 'append', path: [1, 'tasks', 1, ...TEXT], value: 'cd' },
	{ op: 'set', path: [1, 'tasks', 1, 'status'], value: 'complete' },
	{ op: 'append', path: [1, 'tasks'], value: { task_id: 'step-2', title: 'Search', status: 'in_progress' } },
	{ op: 'set', path: [1, 'tasks', 2, 'status'], value: 'complete' },
	{ op: 'append', path: [], value: { type: 'section', text: { type: 'mrkdwn', text: 'x' } } },
	{ op: 'append', path: [2, 'text', 'text'], value: 'y' },
	{ op: 'append', path: [2, 'text', 'text'], value: 'z' },
];

test('applies array pushes, string concats and sets in order', () => {
	const blocks = placeholder();
	applyBlockOps(blocks, ops);
	assert.deepEqual(
		blocks[1].tasks.map((t) => [t.task_id, t.status]),
		[
			['step-0', 'complete'],
			['step-1', 'complete'],
			['step-2', 'complete'],
		],
	);
	assert.equal(blocks[1].tasks[1].details.elements[0].elements[0].text, 'abcd');
	assert.equal(blocks[2].text.text, 'xyz');
});

test('a later op sees the effect of an earlier one', () => {
	const blocks = placeholder();
	applyBlockOps(blocks, [ops[1], ops[2]]);
	assert.equal(blocks[1].tasks[1].details.elements[0].elements[0].text, 'ab');
});

test('an applied value is copied, so later ops do not change the delta that carried it', () => {
	const blocks = placeholder();
	applyBlockOps(blocks, ops.slice(0, 3));
	assert.equal(ops[1].value.details.elements[0].elements[0].text, '');
});

test('the coalesced ops give the same blocks as the plain ops, in fewer ops', () => {
	const plain = placeholder();
	applyBlockOps(plain, ops);
	const folded = coalesceOps(placeholder(), ops);
	const blocks = placeholder();
	applyBlockOps(blocks, folded);
	assert.deepEqual(blocks, plain);
	assert.equal(folded.length, 6);
	assert.equal(folded[1].value.details.elements[0].elements[0].text, 'abcd');
	assert.equal(folded[5].value.text.text, 'xyz');
});

test('text appends to one string merge when no item is created in the window', () => {
	const blocks = placeholder();
	applyBlockOps(blocks, [ops[1]]);
	const text = [ops[2], ops[3]];
	assert.deepEqual(coalesceOps(blocks, text), [{ op: 'append', path: ops[2].path, value: 'abcd' }]);
});

test('coalescing leaves the ops it was given as they were', () => {
	coalesceOps(placeholder(), ops);
	assert.equal(ops[1].value.details.elements[0].elements[0].text, '');
});

test('the end closes the open task: complete, or error for an error', () => {
	for (const [reason, status] of [
		['done', 'complete'],
		['stopped', 'complete'],
		['error', 'error'],
	]) {
		const blocks = placeholder();
		closeOpenTask(blocks, reason);
		assert.equal(blocks[1].tasks[0].status, status);
	}
});
