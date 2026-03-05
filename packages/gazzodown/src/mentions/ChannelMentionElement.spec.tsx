import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import ChannelMentionElement from './ChannelMentionElement';

describe('ChannelMentionElement', () => {
	it('renders unresolved channel mention as plain text', () => {
		render(<ChannelMentionElement mention='general' />);
		expect(screen.getByText('#general')).toBeInTheDocument();
	});

	it('renders resolved channel mention', () => {
		const resolveChannelMention = jest.fn(() => ({
			_id: 'channel123',
			name: 'general',
			fname: 'General Chat',
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveChannelMention }}>
				<ChannelMentionElement mention='general' />
			</MarkupInteractionContext.Provider>,
		);

		expect(resolveChannelMention).toHaveBeenCalledWith('general');
		expect(screen.getByText('General Chat')).toBeInTheDocument();
	});

	it('renders with # symbol when showMentionSymbol is true', () => {
		const resolveChannelMention = jest.fn(() => ({
			_id: 'channel123',
			name: 'general',
			fname: 'General Chat',
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveChannelMention, showMentionSymbol: true }}>
				<ChannelMentionElement mention='general' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('#General Chat')).toBeInTheDocument();
	});

	it('falls back to mention string when fname is not available', () => {
		const resolveChannelMention = jest.fn(() => ({
			_id: 'channel123',
			name: 'general',
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveChannelMention }}>
				<ChannelMentionElement mention='general' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('general')).toBeInTheDocument();
	});

	it('matches snapshot for resolved channel mention', () => {
		const resolveChannelMention = jest.fn(() => ({
			_id: 'channel123',
			name: 'general',
			fname: 'General',
		}));

		const { container } = render(
			<MarkupInteractionContext.Provider value={{ resolveChannelMention }}>
				<ChannelMentionElement mention='general' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot for unresolved channel mention', () => {
		const { container } = render(<ChannelMentionElement mention='unknown' />);
		expect(container).toMatchSnapshot();
	});
});
