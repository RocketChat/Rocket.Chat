import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';

import { MarkupInteractionContext } from '..';
import InlineElements from './InlineElements';

jest.mock('highlight.js', () => ({
	highlightElement: (): void => undefined,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rocket.chat/ui-client/dist/helpers/getBaseURI', () => ({
	getBaseURI: jest.fn(() => 'http://localhost:3000/'),
	isExternal: jest.fn(() => true),
}));

const renderInlineElements = (children: Parameters<typeof InlineElements>[0]['children']) =>
	render(
		<Suspense fallback={null}>
			<InlineElements>{children}</InlineElements>
		</Suspense>,
	);

describe('InlineElements', () => {
	it('renders PLAIN_TEXT', () => {
		renderInlineElements([{ type: 'PLAIN_TEXT', value: 'Hello world' }]);
		expect(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('renders BOLD', () => {
		renderInlineElements([{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold text' }] }]);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Bold text').closest('strong')).toBeInTheDocument();
	});

	it('renders ITALIC', () => {
		renderInlineElements([{ type: 'ITALIC', value: [{ type: 'PLAIN_TEXT', value: 'Italic text' }] }]);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Italic text').closest('em')).toBeInTheDocument();
	});

	it('renders STRIKE', () => {
		renderInlineElements([{ type: 'STRIKE', value: [{ type: 'PLAIN_TEXT', value: 'Struck text' }] }]);
		// eslint-disable-next-line testing-library/no-node-access
		expect(screen.getByText('Struck text').closest('del')).toBeInTheDocument();
	});

	it('renders INLINE_CODE', () => {
		renderInlineElements([{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'code()' } }]);
		expect(screen.getByText('code()')).toBeInTheDocument();
	});

	it('renders LINK', () => {
		renderInlineElements([
			{
				type: 'LINK',
				value: {
					src: { type: 'PLAIN_TEXT', value: 'https://example.com' },
					label: { type: 'PLAIN_TEXT', value: 'Example' },
				},
			},
		]);
		expect(screen.getByRole('link')).toHaveTextContent('Example');
	});

	it('renders IMAGE', () => {
		renderInlineElements([
			{
				type: 'IMAGE',
				value: {
					src: { type: 'PLAIN_TEXT', value: 'https://example.com/img.png' },
					label: { type: 'PLAIN_TEXT', value: 'Alt text' },
				},
			},
		]);
		expect(screen.getByRole('img')).toHaveAttribute('alt', 'Alt text');
	});

	it('renders MENTION_USER', () => {
		renderInlineElements([{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'john' } }]);
		expect(screen.getByText('@john')).toBeInTheDocument();
	});

	it('renders MENTION_CHANNEL', () => {
		renderInlineElements([{ type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: 'general' } }]);
		expect(screen.getByText('#general')).toBeInTheDocument();
	});

	it('renders EMOJI', () => {
		render(
			<Suspense fallback={null}>
				<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
					<InlineElements>{[{ type: 'EMOJI', value: undefined, unicode: '😀' }]}</InlineElements>
				</MarkupInteractionContext.Provider>
			</Suspense>,
		);
		expect(screen.getByRole('img')).toHaveTextContent('😀');
	});

	it('renders COLOR', () => {
		renderInlineElements([{ type: 'COLOR', value: { r: 255, g: 0, b: 0, a: 255 } }]);
		expect(screen.getByText(/rgba\(255, 0, 0/)).toBeInTheDocument();
	});

	it('renders multiple inline elements', () => {
		renderInlineElements([
			{ type: 'PLAIN_TEXT', value: 'Hello ' },
			{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'world' }] },
		]);
		expect(screen.getByText('Hello')).toBeInTheDocument();
		expect(screen.getByText('world')).toBeInTheDocument();
	});

	it('renders fallback for unknown types', () => {
		renderInlineElements([{ fallback: { type: 'PLAIN_TEXT', value: 'Fallback text' }, type: undefined }]);
		expect(screen.getByText('Fallback text')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = renderInlineElements([
			{ type: 'PLAIN_TEXT', value: 'Text ' },
			{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'bold' }] },
			{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'code' } },
		]);
		expect(container).toMatchSnapshot();
	});
});
