import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import Emoji from './Emoji';

describe('Emoji', () => {
	it('renders emoji unicode fallback when detectEmoji is not provided', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={undefined} unicode='😀' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('😀');
	});

	it('renders shortCode fallback when detectEmoji is not provided', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'smile' }} shortCode='smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent(':smile:');
	});

	it('renders plain text when useEmoji is false', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: false }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'smile' }} shortCode='smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':smile:')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('renders ASCII text when convertAsciiToEmoji is false and emoji is ASCII', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: false, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: ':)' }} shortCode='slight_smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':)')).toBeInTheDocument();
	});

	it('renders emoji renderer when convertAsciiToEmoji is true', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: ':)' }} shortCode='slight_smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toBeInTheDocument();
	});

	it('renders original value text when useEmoji is false and shortCode matches value', () => {
		render(
			<MarkupInteractionContext.Provider value={{ useEmoji: false }}>
				<Emoji type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'thumbsup' }} shortCode='thumbsup' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText(':thumbsup:')).toBeInTheDocument();
	});
});
