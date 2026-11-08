import { flattenBlocks } from './nestedBlocks';

const ids = (blocks: unknown[]) => flattenBlocks<{ type: string }>(blocks).map(({ block, blockId }) => [block.type, blockId]);

it('walks container, layout and conditional blocks, giving each block the blockId of its nearest holder', () => {
	expect(
		ids([
			{
				type: 'container',
				blockId: 'outer',
				child_blocks: [
					{ type: 'input' },
					{ type: 'layout', rows: [{ items: [null, { block: { type: 'input', blockId: 'own' } }, { block: { type: 'input' } }] }] },
					{ type: 'conditional', blockId: 'cond', render: [{ type: 'input' }] },
					{ type: 'conditional', when: { engine: ['livechat'] }, render: [{ type: 'input', blockId: 'skipped' }] },
					{ type: 'conditional', when: { engine: ['rocket.chat'] }, render: [{ type: 'input', blockId: 'web' }] },
				],
			},
			{ type: 'input' },
		]),
	).toEqual([
		['container', 'outer'],
		['input', 'outer'],
		['layout', 'outer'],
		['input', 'own'],
		['input', 'outer'],
		['conditional', 'outer'],
		['input', 'outer'],
		['conditional', 'outer'],
		['conditional', 'outer'],
		['input', 'web'],
		['input', undefined],
	]);
});
