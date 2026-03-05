import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import PreviewEmojiElement from './PreviewEmojiElement';

describe('PreviewEmojiElement', () => {
	it('renders unicode emoji in preview mode', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewEmojiElement type='EMOJI' value={undefined} unicode='🌟' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByRole('img')).toHaveTextContent('🌟');
	});

	it('renders shortCode emoji in preview mode', () => {
		render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewEmojiElement type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'thumbsup' }} shortCode='thumbsup' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':thumbsup:')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
				<PreviewEmojiElement type='EMOJI' value={undefined} unicode='🚀' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
