import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import * as stories from './DiscussionsList.stories';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: jest.fn(() => ({})),
	},
}));

jest.mock('virtua', () => require('../../../../../tests/mocks/client/virtua'));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	CustomVirtuaScrollbars: require('../../../../../tests/mocks/client/CustomVirtuaScrollbars').MockCustomVirtuaScrollbars,
}));

const composed = composeStories(stories);
const testCases = Object.values(composed).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('DiscussionsList', () => {
	it('renders Default with virtual list and discussion rows', () => {
		const { Default } = composed;
		render(<Default />);

		const list = screen.getByRole('list');
		expect(list).toBeInTheDocument();
		expect(list.tagName.toLowerCase()).toBe('ul');
		expect(within(list).getAllByRole('listitem')).toHaveLength(10);
		expect(within(list).getAllByText('user.name')).toHaveLength(10);
	});

	it('renders Empty without virtual list', () => {
		const { Empty } = composed;
		render(<Empty />);

		expect(screen.queryByRole('list')).not.toBeInTheDocument();
		expect(screen.getByText('No_Discussions_found')).toBeInTheDocument();
	});

	it('renders Loading without virtual list', () => {
		const { Loading } = composed;
		render(<Loading />);

		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});
});

test.each(testCases)('renders %s with stable structure', (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
