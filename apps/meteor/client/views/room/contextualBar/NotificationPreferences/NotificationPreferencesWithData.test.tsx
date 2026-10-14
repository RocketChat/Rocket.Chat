import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let NotificationPreferencesWithData: (typeof import('./NotificationPreferencesWithData'))['default'];

const mockPlay = fn<FunctionLike>();
const mockCloseTab = fn<FunctionLike>();
const mockUseRoomSubscription = fn<FunctionLike>();

const appRoot = (userPreferences?: Record<string, unknown>) =>
	mockAppRoot()
		.withUserPreference('newMessageNotification', userPreferences?.newMessageNotification ?? 'chime')
		.build();

describe('NotificationPreferencesWithData - handlePlaySound', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useCustomSound: () => ({ play: mockPlay, list: [] }),
				useRoomToolbox: () => ({ closeTab: mockCloseTab }),
				useToastMessageDispatch: () => fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/RoomContext', {
			exports: {
				useRoom: () => ({ _id: 'GENERAL' }),
				useRoomSubscription: () => mockUseRoomSubscription(),
			},
		});
		mock.module('../../../../hooks/useEndpointMutation', {
			exports: {
				useEndpointMutation: () => ({ mutateAsync: fn<FunctionLike>() }),
			},
		});
		({ default: NotificationPreferencesWithData } = require('./NotificationPreferencesWithData'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mockPlay.mockClear();
		mockUseRoomSubscription.mockReturnValue({
			disableNotifications: false,
			muteGroupMentions: false,
			hideUnreadStatus: false,
			hideMentionStatus: false,
			audioNotificationValue: undefined, // desktopSound defaults to 'default'
		});
	});
	it('plays the user newMessageNotification preference when desktopSound is "default"', async () => {
		render(<NotificationPreferencesWithData />, {
			wrapper: appRoot({ newMessageNotification: 'chime' }),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Play' }));

		expect(mockPlay).toHaveBeenCalledWith('chime');
		expect(mockPlay).not.toHaveBeenCalledWith('default');
	});

	it('plays the user preference sound even when it is not the default chime', async () => {
		render(<NotificationPreferencesWithData />, {
			wrapper: appRoot({ newMessageNotification: 'ringtone' }),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Play' }));

		expect(mockPlay).toHaveBeenCalledWith('ringtone');
	});

	it('plays the specific sound directly when desktopSound is not "default"', async () => {
		mockUseRoomSubscription.mockReturnValue({
			disableNotifications: false,
			muteGroupMentions: false,
			hideUnreadStatus: false,
			hideMentionStatus: false,
			audioNotificationValue: 'door',
		});

		render(<NotificationPreferencesWithData />, {
			wrapper: appRoot({ newMessageNotification: 'chime' }),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Play' }));

		expect(mockPlay).toHaveBeenCalledWith('door');
		expect(mockPlay).not.toHaveBeenCalledWith('chime');
	});
});
