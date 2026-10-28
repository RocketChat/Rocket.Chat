import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NotificationPreferencesWithData from './NotificationPreferencesWithData';

const mockPlay = jest.fn();
const mockCloseTab = jest.fn();
const mockUseRoomSubscription = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useCustomSound: () => ({ play: mockPlay, list: [] }),
	useRoomToolbox: () => ({ closeTab: mockCloseTab }),
	useToastMessageDispatch: () => jest.fn(),
}));

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => ({ _id: 'GENERAL' }),
	useRoomSubscription: () => mockUseRoomSubscription(),
}));

jest.mock('../../../../hooks/useEndpointMutation', () => ({
	useEndpointMutation: () => ({ mutateAsync: jest.fn() }),
}));

const appRoot = (userPreferences?: Record<string, unknown>) =>
	mockAppRoot()
		.withUserPreference('newMessageNotification', userPreferences?.newMessageNotification ?? 'chime')
		.build();

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

describe('NotificationPreferencesWithData - handlePlaySound', () => {
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
