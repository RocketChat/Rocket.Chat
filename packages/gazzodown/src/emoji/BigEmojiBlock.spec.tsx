import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import BigEmojiBlock from './BigEmojiBlock';

describe('BigEmojiBlock', () => {
	it('renders multiple emojis', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiBlock
					emoji={[
						{ type: 'EMOJI', value: undefined, unicode: '😀' },
						{ type: 'EMOJI', value: undefined, unicode: '🎉' },
					]}
				/>
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getAllByRole('img')).toHaveLength(2);
	});

	it('renders with presentation role', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiBlock emoji={[{ type: 'EMOJI', value: undefined, unicode: '😀' }]} />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('presentation')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiBlock emoji={[{ type: 'EMOJI', value: undefined, unicode: '🔥' }]} />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
