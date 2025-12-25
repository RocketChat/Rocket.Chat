import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomFormAutocomplete from './RoomFormAutocomplete';
import * as stories from './RoomFormAutocomplete.stories';
import { createFakeRoom } from '../../../../../tests/mocks/data';

const mockRoom1 = createFakeRoom({ t: 'p', name: 'Room 1', fname: 'Room 1' });
const mockRoom2 = createFakeRoom({ t: 'p', name: 'Room 2', fname: 'Room 2' });
const mockRoom3 = createFakeRoom({ t: 'p', name: 'Room 3', fname: 'Room 3', abacAttributes: [] });

const appRoot = mockAppRoot()
	.withEndpoint('GET', '/v1/rooms.adminRooms.privateRooms', () => ({
		rooms: [mockRoom1 as any, mockRoom2 as any, mockRoom3 as any],
		count: 3,
		offset: 0,
		total: 3,
	}))
	.build();

describe('RoomFormAutocomplete', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		// Aria label added in a higher level
		const { container } = render(<Story aria-label='ABAC Room Autocomplete' />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should populate select options correctly', async () => {
		render(<RoomFormAutocomplete value='' onSelectedRoom={jest.fn()} />, {
			wrapper: appRoot,
		});

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('Room 1')).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText('Room 2')).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText('Room 3')).toBeInTheDocument();
		});
	});
});
