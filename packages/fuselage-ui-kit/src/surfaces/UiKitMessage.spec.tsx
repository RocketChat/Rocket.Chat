import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import { UiKitMessage as renderMessage } from '.';

const text = { type: 'plain_text', text: 'Hello' };

const blocks = {
	section: { type: 'section', text },
	data_table: { type: 'data_table', columns: [{ key: 'a', label: 'A' }], rows: [{ a: 'x' }] },
	layout: { type: 'layout', rows: [{ columns: [{ child_blocks: [{ type: 'section', text }] }] }] },
	data_visualization: { type: 'data_visualization', chart_type: 'bar', data: [{ label: 'a', value: 1 }] },
	carousel: { type: 'carousel', elements: [{ type: 'card', title: text }] },
	table: { type: 'table', rows: [[{ type: 'raw_text', text: 'a' }]] },
	container: { type: 'container', title: text, child_blocks: [{ type: 'section', text }] },
	fullContainer: { type: 'container', width: 'full', title: text, child_blocks: [{ type: 'section', text }] },
} as const;

const cappedCount = (...list: object[]) => {
	const { container } = render(<MockedServerContext>{renderMessage(list as never)}</MockedServerContext>);
	return container.querySelectorAll('.rcx-uikit-message-block').length;
};

it('caps a section to the message block width', () => {
	expect(cappedCount(blocks.section)).toBe(1);
});

it.each(['data_table', 'layout', 'data_visualization', 'carousel', 'table', 'container', 'fullContainer'] as const)(
	'does not cap a %s',
	(name) => {
		expect(cappedCount(blocks[name])).toBe(0);
	},
);

it('caps only top-level blocks, including those a conditional block resolves to', () => {
	expect(cappedCount({ type: 'conditional', render: [blocks.section, blocks.section] }, blocks.layout)).toBe(2);
});
