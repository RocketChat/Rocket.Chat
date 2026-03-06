import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import BigEmojiElement from './BigEmojiElement';

describe('BigEmojiElement', () => {
	const detectEmoji = jest.fn((text: string) => [{ name: text, className: 'emoji', image: undefined, content: text }]);

	beforeEach(() => {
		detectEmoji.mockClear();
	});

	it('renders emoji with big style via detected path', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true, detectEmoji }}>
				<BigEmojiElement type='EMOJI' value={undefined} unicode='🚀' />
			</MarkupInteractionContext.Provider>,
		);

		expect(detectEmoji).toHaveBeenCalledWith('🚀');
		expect(screen.getByTitle('🚀')).toBeInTheDocument();
	});

	it('renders shortCode emoji via detected path', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true, detectEmoji }}>
				<BigEmojiElement type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'fire' }} shortCode='fire' />
			</MarkupInteractionContext.Provider>,
		);

		expect(detectEmoji).toHaveBeenCalledWith(':fire:');
		expect(screen.getByTitle(':fire:')).toBeInTheDocument();
	});

	it('falls back to span when detectEmoji is not provided', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<BigEmojiElement type='EMOJI' value={undefined} unicode='🎉' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('🎉');
	});

	it('matches snapshot', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true, detectEmoji }}>
				<BigEmojiElement type='EMOJI' value={undefined} unicode='🎉' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
