import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import EmojiRenderer from './EmojiRenderer';

describe('EmojiRenderer', () => {
	it('renders unicode emoji as fallback span', () => {
		render(
			<MarkupInteractionContext.Provider value={{}}>
				<EmojiRenderer type='EMOJI' value={undefined} unicode='🎉' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle('🎉')).toBeInTheDocument();
		expect(screen.getByRole('img')).toHaveTextContent('🎉');
	});

	it('renders shortCode emoji as fallback when not detected', () => {
		render(
			<MarkupInteractionContext.Provider value={{}}>
				<EmojiRenderer type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'rocket' }} shortCode='rocket' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByTitle(':rocket:')).toBeInTheDocument();
	});

	it('uses detectEmoji when provided', () => {
		const detectEmoji = jest.fn(() => [{ name: 'smile', className: 'emoji-smile', image: undefined, content: '😊' }]);

		render(
			<MarkupInteractionContext.Provider value={{ detectEmoji }}>
				<EmojiRenderer type='EMOJI' value={{ type: 'PLAIN_TEXT', value: 'smile' }} shortCode='smile' />
			</MarkupInteractionContext.Provider>,
		);

		expect(detectEmoji).toHaveBeenCalledWith(':smile:');
		expect(screen.getByTitle('smile')).toBeInTheDocument();
	});

	it('matches snapshot for unicode emoji', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{}}>
				<EmojiRenderer type='EMOJI' value={undefined} unicode='🚀' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
