import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import PreviewInlineElements from './PreviewInlineElements';

describe('PreviewInlineElements', () => {
	it('renders PLAIN_TEXT', () => {
		render(<PreviewInlineElements>{[{ type: 'PLAIN_TEXT', value: 'Hello preview' }]}</PreviewInlineElements>);
		expect(screen.getByText('Hello preview')).toBeInTheDocument();
	});

	it('renders BOLD', () => {
		render(<PreviewInlineElements>{[{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold preview' }] }]}</PreviewInlineElements>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold preview').closest('strong')).toBeInTheDocument();
	});

	it('renders ITALIC', () => {
		render(<PreviewInlineElements>{[{ type: 'ITALIC', value: [{ type: 'PLAIN_TEXT', value: 'Italic preview' }] }]}</PreviewInlineElements>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Italic preview').closest('em')).toBeInTheDocument();
	});

	it('renders STRIKE', () => {
		render(<PreviewInlineElements>{[{ type: 'STRIKE', value: [{ type: 'PLAIN_TEXT', value: 'Struck preview' }] }]}</PreviewInlineElements>);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Struck preview').closest('del')).toBeInTheDocument();
	});

	it('renders INLINE_CODE as preview text', () => {
		render(<PreviewInlineElements>{[{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'code()' } }]}</PreviewInlineElements>);
		expect(screen.getByText('code()')).toBeInTheDocument();
	});

	it('renders LINK label text', () => {
		render(
			<PreviewInlineElements>
				{[
					{
						type: 'LINK',
						value: {
							src: { type: 'PLAIN_TEXT', value: 'https://example.com' },
							label: { type: 'PLAIN_TEXT', value: 'Link label' },
						},
					},
				]}
			</PreviewInlineElements>,
		);
		expect(screen.getByText('Link label')).toBeInTheDocument();
	});

	it('renders IMAGE label text', () => {
		render(
			<PreviewInlineElements>
				{[
					{
						type: 'IMAGE',
						value: {
							src: { type: 'PLAIN_TEXT', value: 'https://example.com/img.png' },
							label: { type: 'PLAIN_TEXT', value: 'Image label' },
						},
					},
				]}
			</PreviewInlineElements>,
		);
		expect(screen.getByText('Image label')).toBeInTheDocument();
	});

	it('renders SPOILER as inline preview (not blurred)', () => {
		render(
			<PreviewInlineElements>{[{ type: 'SPOILER', value: [{ type: 'PLAIN_TEXT', value: 'Spoiler preview' }] }]}</PreviewInlineElements>,
		);
		expect(screen.getByText('Spoiler preview')).toBeInTheDocument();
	});

	it('renders MENTION_USER', () => {
		render(<PreviewInlineElements>{[{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'john' } }]}</PreviewInlineElements>);
		expect(screen.getByText('@john')).toBeInTheDocument();
	});

	it('renders MENTION_CHANNEL', () => {
		render(<PreviewInlineElements>{[{ type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: 'general' } }]}</PreviewInlineElements>);
		expect(screen.getByText('#general')).toBeInTheDocument();
	});

	it('renders EMOJI', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewInlineElements>{[{ type: 'EMOJI', value: undefined, unicode: '😀' }]}</PreviewInlineElements>
			</MarkupInteractionContext.Provider>,
		);
		expect(screen.getByRole('img')).toHaveTextContent('😀');
	});

	it('renders COLOR as hex preview', () => {
		render(<PreviewInlineElements>{[{ type: 'COLOR', value: { r: 255, g: 128, b: 0, a: 255 } }]}</PreviewInlineElements>);
		expect(screen.getByText(/ff8000/i)).toBeInTheDocument();
	});

	it('renders multiple inline elements', () => {
		render(
			<PreviewInlineElements>
				{[
					{ type: 'PLAIN_TEXT', value: 'Hello ' },
					{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'world' }] },
				]}
			</PreviewInlineElements>,
		);
		expect(screen.getByText('Hello')).toBeInTheDocument();
		expect(screen.getByText('world')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<PreviewInlineElements>
				{[
					{ type: 'PLAIN_TEXT', value: 'Preview ' },
					{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'bold' }] },
					{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'code' } },
				]}
			</PreviewInlineElements>,
		);
		expect(container).toMatchSnapshot();
	});
});
