import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import Emoji from './Emoji';

describe('Emoji', () => {
	it('renders unicode emoji via EmojiRenderer', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={undefined} unicode='🚀' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('🚀');
	});

	it('renders shortCode emoji via EmojiRenderer', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'rocket' }} shortCode='rocket' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':rocket:')).toBeInTheDocument();
	});

	it('renders plain text when useEmoji is false for shortCode emoji', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: false }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'rocket' }} shortCode='rocket' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':rocket:')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('renders ascii value when useEmoji is false and value differs from shortCode', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: false }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: ':)' }} shortCode='slight_smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':)')).toBeInTheDocument();
	});

	it('renders ascii text when convertAsciiToEmoji is false', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: false, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: ':)' }} shortCode='slight_smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':)')).toBeInTheDocument();
	});

	it('renders normally when convertAsciiToEmoji is true', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: ':)' }} shortCode='slight_smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':slight_smile:')).toBeInTheDocument();
	});

	it('passes big prop to EmojiRenderer', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji big type='EMOJI' value={undefined} unicode='🔥' />
			</MarkupInteractionContext.Provider>,
		);

		expect(container).toMatchSnapshot();
	});

	it('passes preview prop to EmojiRenderer', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji preview type='EMOJI' value={undefined} unicode='🎉' />
			</MarkupInteractionContext.Provider>,
		);

		expect(container).toMatchSnapshot();
	});
});
