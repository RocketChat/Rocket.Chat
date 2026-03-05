import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import BigEmojiElement from './BigEmojiElement';

describe('BigEmojiElement', () => {
	it('renders emoji with big style', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiElement type='EMOJI' value={undefined} unicode='🚀' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('🚀');
	});

	it('renders shortCode emoji', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiElement type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'fire' }} shortCode='fire' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':fire:')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiElement type='EMOJI' value={undefined} unicode='🎉' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
