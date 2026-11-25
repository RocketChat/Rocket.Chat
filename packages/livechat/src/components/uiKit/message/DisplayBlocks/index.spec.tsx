import { render } from 'preact-render-to-string';

import { renderMessageBlocks } from '..';

jest.mock('../../../MarkdownBlock', () => ({ __esModule: true, default: () => null }));
jest.mock('../PlainText', () => ({ __esModule: true, default: ({ text }: { text: string }) => text }));

const html = (blocks: unknown[]) => render(<div>{renderMessageBlocks(blocks)}</div>);

describe('Livechat message renderer', () => {
	it('draws a header', () => {
		expect(html([{ type: 'header', text: { type: 'plain_text', text: 'Hello' } }])).toContain('Hello');
	});

	it('draws a callout with its title and text', () => {
		const out = html([
			{ type: 'callout', variant: 'danger', title: { type: 'plain_text', text: 'Careful' }, text: { type: 'plain_text', text: 'Body' } },
		]);

		expect(out).toContain('Careful');
		expect(out).toContain('Body');
	});

	it('draws a table with the first row as header', () => {
		const out = html([{ type: 'table', rows: [[{ type: 'raw_text', text: 'Name' }], [{ type: 'raw_text', text: 'Ada' }]] }]);

		expect(out).toMatch(/<th[^>]*>Name<\/th>/);
		expect(out).toMatch(/<td[^>]*>Ada<\/td>/);
	});

	it('draws a video without an unsafe thumbnail or a frame', () => {
		const out = html([
			{
				type: 'video',
				video_url: 'https://example.com/embed',
				thumbnail_url: 'javascript:alert(1)',
				alt_text: 'A video',
				title: { type: 'plain_text', text: 'Clip' },
			},
		]);

		expect(out).toContain('Clip');
		expect(out).not.toContain('javascript:');
		expect(out).not.toContain('<iframe');
	});

	it('draws a preview with its title and description', () => {
		const out = html([
			{ type: 'preview', title: [{ type: 'plain_text', text: 'Page' }], description: [{ type: 'plain_text', text: 'About it' }] },
		]);

		expect(out).toContain('Page');
		expect(out).toContain('About it');
	});

	it('draws feedback and icon buttons in context_actions', () => {
		const out = html([
			{
				type: 'context_actions',
				elements: [
					{
						type: 'feedback_buttons',
						actionId: 'rate',
						positive_button: { text: { type: 'plain_text', text: 'Good' }, value: 'up' },
						negative_button: { text: { type: 'plain_text', text: 'Bad' }, value: 'down' },
					},
					{ type: 'icon_button', actionId: 'copy', icon: { type: 'icon', icon: 'copy' }, label: 'Copy' },
				],
			},
		]);

		expect(out).toContain('aria-label="Good"');
		expect(out).toContain('aria-label="Bad"');
		expect(out).toContain('aria-label="Copy"');
	});

	it('draws a multi_static_select with its options and initial selection', () => {
		const out = html([
			{
				type: 'actions',
				elements: [
					{
						type: 'multi_static_select',
						actionId: 'multi',
						placeholder: { type: 'plain_text', text: 'Pick' },
						options: [
							{ text: { type: 'plain_text', text: 'One' }, value: '1' },
							{ text: { type: 'plain_text', text: 'Two' }, value: '2' },
						],
						initialValue: ['2'],
					},
				],
			},
		]);

		expect(out).toContain('multiple');
		expect(out).toMatch(/<option[^>]*value="2"[^>]*selected/);
	});
});
