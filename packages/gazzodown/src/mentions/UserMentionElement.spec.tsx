import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import UserMentionElement from './UserMentionElement';

describe('UserMentionElement', () => {
	it('renders unresolved mention as plain text', () => {
		render(<UserMentionElement mention='john' />);
		expect(screen.getByText('@john')).toBeInTheDocument();
	});

	it('renders @all mention with relevant variant', () => {
		render(<UserMentionElement mention='all' />);
		expect(screen.getByText('all')).toBeInTheDocument();
	});

	it('renders @here mention with relevant variant', () => {
		render(<UserMentionElement mention='here' />);
		expect(screen.getByText('here')).toBeInTheDocument();
	});

	it('renders resolved user mention with username', () => {
		const resolveUserMention = jest.fn((mention: string) => ({
			_id: 'user123',
			username: mention,
			name: 'John Doe',
			type: 'user' as const,
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveUserMention }}>
				<UserMentionElement mention='john' />
			</MarkupInteractionContext.Provider>,
		);

		expect(resolveUserMention).toHaveBeenCalledWith('john');
		expect(screen.getByText('john')).toBeInTheDocument();
	});

	it('renders resolved user mention with real name when useRealName is true', () => {
		const resolveUserMention = jest.fn(() => ({
			_id: 'user123',
			username: 'john',
			name: 'John Doe',
			type: 'user' as const,
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveUserMention, useRealName: true }}>
				<UserMentionElement mention='john' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('John Doe')).toBeInTheDocument();
	});

	it('renders with @ symbol when showMentionSymbol is true', () => {
		const resolveUserMention = jest.fn(() => ({
			_id: 'user123',
			username: 'john',
			name: 'John Doe',
			type: 'user' as const,
		}));

		render(
			<MarkupInteractionContext.Provider value={{ resolveUserMention, showMentionSymbol: true }}>
				<UserMentionElement mention='john' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('@john')).toBeInTheDocument();
	});

	it('renders @all with @ symbol when showMentionSymbol is true', () => {
		render(
			<MarkupInteractionContext.Provider value={{ showMentionSymbol: true }}>
				<UserMentionElement mention='all' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('@all')).toBeInTheDocument();
	});

	it('matches snapshot for resolved mention', () => {
		const resolveUserMention = jest.fn(() => ({
			_id: 'user123',
			username: 'john',
			name: 'John Doe',
			type: 'user' as const,
		}));

		const { container } = render(
			<MarkupInteractionContext.Provider value={{ resolveUserMention }}>
				<UserMentionElement mention='john' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});

	it('matches snapshot for unresolved mention', () => {
		const { container } = render(<UserMentionElement mention='unknown' />);
		expect(container).toMatchSnapshot();
	});
});
