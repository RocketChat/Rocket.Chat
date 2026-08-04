import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomInvite from './RoomInviteBody';
import * as stories from './RoomInviteBody.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const appRoot = mockAppRoot().build();

describe('RoomInvite', () => {
	const onAccept = jest.fn();
	const onReject = jest.fn();
	const inviter = {
		username: 'rocket.cat',
		name: 'Rocket Cat',
		_id: 'rocket.cat',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const view = render(<Story />, { wrapper: appRoot });
		expect(view.baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should call onAccept when accept button is clicked', async () => {
		render(<RoomInvite inviter={inviter} onAccept={onAccept} onReject={onReject} />, { wrapper: appRoot });

		await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

		expect(onAccept).toHaveBeenCalled();
		expect(onReject).not.toHaveBeenCalled();
	});

	it('should call onReject when reject button is clicked', async () => {
		render(<RoomInvite inviter={inviter} onAccept={onAccept} onReject={onReject} />, { wrapper: appRoot });

		await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

		expect(onReject).toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
	});
});
