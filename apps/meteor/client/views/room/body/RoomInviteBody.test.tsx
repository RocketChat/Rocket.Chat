import { beforeEach, describe, it, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

import RoomInvite from './RoomInviteBody';
import * as stories from './RoomInviteBody.stories';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const appRoot = mockAppRoot().build();

describe('RoomInvite', () => {
	const onAccept = fn<FunctionLike>();
	const onReject = fn<FunctionLike>();
	const inviter = {
		username: 'rocket.cat',
		name: 'Rocket Cat',
		_id: 'rocket.cat',
	};

	beforeEach(() => {
		mocker.clearAllMocks();
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const view = render(<Story />, { wrapper: appRoot });
			t.assert.snapshot(view.baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`${_storyname} should have no a11y violations`, async () => {
			const { container } = render(<Story />, { wrapper: appRoot });

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
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
