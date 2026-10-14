import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import type { FunctionLike, Mock } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

import { createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let UserAndRoomAutoCompleteMultiple: (typeof import('./UserAndRoomAutoCompleteMultiple'))['default'];
let roomCoordinator: (typeof import('../../lib/rooms/roomCoordinator'))['roomCoordinator'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
});

const direct = createFakeSubscription({
	t: 'd',
	name: 'Direct',
});

const channel = createFakeSubscription({
	t: 'c',
	name: 'General',
});

const appRoot = new MockedAppRootBuilder()
	.withSubscriptions([
		{ ...direct, ro: false },
		{ ...channel, ro: true },
	] as unknown as SubscriptionWithRoom[])
	.withUser(user);

describe('UserAndRoomAutoCompleteMultiple', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					readOnly: fn<FunctionLike>(),
				},
			},
		});
		({ default: UserAndRoomAutoCompleteMultiple } = require('./UserAndRoomAutoCompleteMultiple'));
		({ roomCoordinator } = require('../../lib/rooms/roomCoordinator'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		(roomCoordinator.readOnly as Mock<FunctionLike>).mockReturnValue(false);
	});

	afterEach(() => mocker.clearAllMocks());

	it('should render options based on user subscriptions', async () => {
		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={fn<FunctionLike>()} />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('Direct')).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText('General')).toBeInTheDocument();
		});
	});

	it('should filter out read-only rooms', async () => {
		(roomCoordinator.readOnly as Mock<FunctionLike>).mockReturnValueOnce(true);

		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={fn<FunctionLike>()} />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('General')).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.queryByText('Direct')).not.toBeInTheDocument();
		});
	});

	it('should call onChange when selecting an option', async () => {
		const handleChange = fn<FunctionLike>();
		render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={handleChange} />, { wrapper: appRoot.build() });

		const input = screen.getByRole('textbox');
		await userEvent.click(input);

		await waitFor(() => {
			expect(screen.getByText('General')).toBeInTheDocument();
		});

		await userEvent.click(screen.getByText('General'));
		expect(handleChange).toHaveBeenCalled();
	});
});
