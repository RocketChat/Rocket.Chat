import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import SearchSourceResult from './SearchSourceResult';

import '@testing-library/jest-dom';

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRouteLink: jest.fn(() => '/channel/general'),
	},
}));

describe('SearchSourceResult', () => {
	it('renders source metadata, markdown, and a message link', () => {
		render(
			<SearchSourceResult
				item={{
					_id: 'message-id',
					rid: 'room-id',
					msgId: 'message-id',
					text: '**Oranges** are green',
					score: 0.61,
					ts: '2026-01-05T12:00:00.000Z',
					u: { name: 'Search User', username: 'search.user' },
					room: { _id: 'room-id', t: 'c', name: 'general', fname: 'General' },
				}}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(screen.getByText('Search User')).toBeInTheDocument();
		expect(screen.getByText('@search.user')).toBeInTheDocument();
		expect(screen.getByText('General')).toBeInTheDocument();
		expect(screen.getByText('61%')).toBeInTheDocument();
		expect(screen.getByText('Oranges').tagName).toBe('STRONG');
		expect(screen.getByRole('link')).toHaveAttribute('href', '/channel/general?msg=message-id');
	});

	it('clamps an out-of-range relevance score to 100%', () => {
		render(
			<SearchSourceResult
				item={{
					_id: 'message-id',
					text: 'plain text',
					score: 1.5,
					u: { name: 'Search User', username: 'search.user' },
					room: { _id: 'room-id', t: 'c', name: 'general', fname: 'General' },
				}}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(screen.getByText('100%')).toBeInTheDocument();
	});

	it('does not render a link when the source has no resolvable room', () => {
		render(
			<SearchSourceResult
				item={{
					_id: 'message-id',
					text: 'orphan message',
					u: { name: 'Search User', username: 'search.user' },
				}}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(screen.getByText('orphan message')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});
