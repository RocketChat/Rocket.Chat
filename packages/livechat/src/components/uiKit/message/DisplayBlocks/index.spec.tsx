import { render as renderToString } from 'preact-render-to-string';

import { renderMessageBlocks } from '..';

jest.mock('../../../MarkdownBlock', () => ({ __esModule: true, default: () => null }));
jest.mock('../PlainText', () => ({ __esModule: true, default: ({ text }: { text: string }) => text }));

const html = (blocks: unknown[]) => renderToString(<div>{renderMessageBlocks(blocks)}</div>);

describe('Livechat message renderer', () => {
	it('draws a header', () => {
		expect(html([{ type: 'header', text: { type: 'plain_text', text: 'Hello' } }])).toContain('Hello');
	});

	it('draws a callout with its title and text', () => {
		const view = html([
			{ type: 'callout', variant: 'danger', title: { type: 'plain_text', text: 'Careful' }, text: { type: 'plain_text', text: 'Body' } },
		]);

		expect(view).toContain('Careful');
		expect(view).toContain('Body');
	});

	it('draws a table with the first row as header', () => {
		const view = html([{ type: 'table', rows: [[{ type: 'raw_text', text: 'Name' }], [{ type: 'raw_text', text: 'Ada' }]] }]);

		expect(view).toMatch(/<th[^>]*>Name<\/th>/);
		expect(view).toMatch(/<td[^>]*>Ada<\/td>/);
	});

	it('draws a video without an unsafe thumbnail or a frame', () => {
		const view = html([
			{
				type: 'video',
				video_url: 'https://example.com/embed',
				thumbnail_url: 'javascript:alert(1)',
				alt_text: 'A video',
				title: { type: 'plain_text', text: 'Clip' },
			},
		]);

		expect(view).toContain('Clip');
		expect(view).not.toContain('javascript:');
		expect(view).not.toContain('<iframe');
	});

	it('draws a preview with its title and description', () => {
		const view = html([
			{ type: 'preview', title: [{ type: 'plain_text', text: 'Page' }], description: [{ type: 'plain_text', text: 'About it' }] },
		]);

		expect(view).toContain('Page');
		expect(view).toContain('About it');
	});

	it('draws feedback and icon buttons in context_actions', () => {
		const view = html([
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

		expect(view).toContain('aria-label="Good"');
		expect(view).toContain('aria-label="Bad"');
		expect(view).toContain('aria-label="Copy"');
	});

	it('draws a multi_static_select with its options and initial selection', () => {
		const view = html([
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

		expect(view).toContain('multiple');
		expect(view).toMatch(/<option[^>]*value="2"[^>]*selected/);
	});
});
