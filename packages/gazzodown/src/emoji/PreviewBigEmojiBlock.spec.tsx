import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import PreviewBigEmojiBlock from './PreviewBigEmojiBlock';

describe('PreviewBigEmojiBlock', () => {
	it('renders multiple emojis', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewBigEmojiBlock
					emoji={[
						{ type: 'EMOJI', value: undefined, unicode: '😀' },
						{ type: 'EMOJI', value: undefined, unicode: '🎉' },
						{ type: 'EMOJI', value: undefined, unicode: '🚀' },
					]}
				/>
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getAllByRole('img')).toHaveLength(3);
	});

	it('renders a single emoji', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewBigEmojiBlock emoji={[{ type: 'EMOJI', value: undefined, unicode: '🔥' }]} />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('🔥');
	});

	it('renders shortCode emojis', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewBigEmojiBlock emoji={[{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'rocket' }, shortCode: 'rocket' }]} />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':rocket:')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewBigEmojiBlock
					emoji={[
						{ type: 'EMOJI', value: undefined, unicode: '😀' },
						{ type: 'EMOJI', value: undefined, unicode: '🎉' },
					]}
				/>
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
