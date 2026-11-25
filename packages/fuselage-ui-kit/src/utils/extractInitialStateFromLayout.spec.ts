import { extractInitialStateFromLayout } from './extractInitialStateFromLayout';

const input = (actionId: string, blockId: string, initialValue: string) => ({
	type: 'input',
	blockId,
	label: { type: 'plain_text', text: actionId },
	element: { type: 'plain_text_input', actionId, initialValue },
});

it('collects the initial value of inputs nested in containers and layouts', () => {
	expect(
		extractInitialStateFromLayout([
			input('top', 'b0', 'zero'),
			{
				type: 'container',
				title: { type: 'plain_text', text: 'Box' },
				child_blocks: [
					input('inside', 'b1', 'one'),
					{ type: 'layout', label: 'Grid', rows: [{ items: [{ block: input('deep', 'b2', 'two') }, { block: { type: 'divider' } }] }] },
				],
			},
		] as never),
	).toEqual({
		top: { value: 'zero', blockId: 'b0' },
		inside: { value: 'one', blockId: 'b1' },
		deep: { value: 'two', blockId: 'b2' },
	});
});

it('skips a layout whose rows are malformed', () => {
	expect(extractInitialStateFromLayout([{ type: 'layout', label: 'Grid', rows: [{}, null, { items: [null] }] }] as never)).toEqual({});
});

it('stores a nested input without a blockId under the blockId of the block that holds it', () => {
	const { blockId, ...nested } = input('inside', 'unused', 'one');

	expect(
		extractInitialStateFromLayout([
			{ type: 'container', blockId: 'holder', title: { type: 'plain_text', text: 'Box' }, child_blocks: [nested] },
		] as never),
	).toEqual({ inside: { value: 'one', blockId: 'holder' } });
});

it('reads a conditional block as the renderer does: no id handed down, and only the branch the web client draws', () => {
	const { blockId, ...nested } = input('inside', 'unused', 'one');

	expect(
		extractInitialStateFromLayout([
			{
				type: 'container',
				blockId: 'holder',
				title: { type: 'plain_text', text: 'Box' },
				child_blocks: [
					{ type: 'conditional', blockId: 'cond', render: [nested] },
					{ type: 'conditional', when: { engine: ['livechat'] }, render: [input('skipped', 'x', 'two')] },
				],
			},
		] as never),
	).toEqual({ inside: { value: 'one', blockId: 'holder' } });
});
