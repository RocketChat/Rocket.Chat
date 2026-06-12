import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { SourceResult } from './SearchPage';

import '@testing-library/jest-dom';

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRouteLink: jest.fn(() => '/channel/general'),
	},
}));

describe('AI Search SourceResult', () => {
	it('renders source messages as compact inline message results', () => {
		render(
			<SourceResult
				item={{
					_id: 'm1',
					rid: 'r1',
					msgId: 'm1',
					text: '**Oranges** are green',
					score: 0.61,
					ts: '2026-01-05T12:00:00.000Z',
					u: { name: 'Search User', username: 'search.user' },
					room: { _id: 'r1', t: 'c', name: 'general', fname: 'General' },
				}}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		expect(screen.getByText('Search User')).toBeInTheDocument();
		expect(screen.getByText('@search.user')).toBeInTheDocument();
		expect(screen.getByText('General')).toBeInTheDocument();
		expect(screen.getByText('61%')).toBeInTheDocument();
		expect(screen.getByText('Oranges').tagName).toBe('STRONG');
		expect(screen.getByText(/are green/)).toBeInTheDocument();
		expect(
			screen.queryByText((_, element) => element?.tagName === 'P' && element.textContent === 'Oranges are green'),
		).not.toBeInTheDocument();
	});
});
