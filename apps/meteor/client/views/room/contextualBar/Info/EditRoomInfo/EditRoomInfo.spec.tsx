import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EditRoomInfo from './EditRoomInfo';
import { createFakeRoom } from '../../../../../../tests/mocks/data';

jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			allowRoomSettingChange: () => true,
		}),
		getRoomName: (_t: string, room: { name?: string }) => room.name ?? 'test-room',
	},
}));

jest.mock('../../../../../components/avatar/RoomAvatarEditor', () => ({
	__esModule: true,
	default: () => null,
}));

const noop = () => undefined;

const createRoom = (sysMes?: string[]) =>
	createFakeRoom<IRoomWithRetentionPolicy>({
		t: 'c',
		name: 'test-room',
		...(sysMes && { sysMes: sysMes as IRoomWithRetentionPolicy['sysMes'] }),
	});

const buildAppRoot = (saveFn: jest.Mock, room: IRoomWithRetentionPolicy) =>
	mockAppRoot()
		.withJohnDoe()
		.withPermission('edit-room')
		.withEndpoint('POST', '/v1/rooms.saveRoomSettings', saveFn as never)
		.withEndpoint('POST', '/v1/rooms.changeArchivationState', () => ({ success: true }) as never)
		.withEndpoint('GET', '/v1/rooms.nameExists', () => ({ exists: false }) as never)
		.withSetting('UTF8_Channel_Names_Validation', '[0-9a-zA-Z-_.]+')
		.withSetting('UI_Allow_room_names_with_special_chars', true)
		.withSetting('RetentionPolicy_Enabled', false)
		.withTranslations('en', 'core', {
			Save: 'Save',
			Hide_System_Messages: 'Hide system messages',
			Advanced_settings: 'Advanced settings',
			Select_messages_to_hide: 'Select messages to hide',
		})
		.withRoom(room)
		.build();

const openAdvancedSettings = async () => {
	await userEvent.click(await screen.findByRole('button', { name: /Advanced settings/i }));
};

const findHideSysMesToggle = () => screen.findByLabelText(/Hide system messages/i);

const clickSave = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));
};

const removeSystemMessageChip = async (translationKey: string) => {
	const chip = screen.getByRole('button', { name: new RegExp(translationKey, 'i') });
	await userEvent.click(chip);
};

const selectSystemMessageOption = async (translationKey: string) => {
	const trigger = screen.getByRole('combobox', { name: /Select messages to hide/i });
	await userEvent.click(trigger);

	const listboxes = await screen.findAllByRole('listbox', { hidden: true });
	const listbox = listboxes.find((el) => within(el).queryAllByRole('option', { hidden: true }).length > 0);

	if (!listbox) {
		throw new Error('Could not find a listbox containing options');
	}

	const optionEl = within(listbox).getByText(translationKey).closest('li[role="option"]');

	if (!optionEl) {
		throw new Error(`Could not find option with text "${translationKey}"`);
	}

	await userEvent.click(optionEl);
};

it('should send systemMessages: [] when hideSysMes is toggled OFF', async () => {
	const saveFn = jest.fn((_data: Record<string, unknown>) => ({ rid: 'room-id', success: true }));
	const room = createRoom(['au', 'ru']);

	render(<EditRoomInfo room={room} onClickClose={noop} onClickBack={noop} />, { wrapper: buildAppRoot(saveFn, room) });
	await openAdvancedSettings();

	const toggle = await findHideSysMesToggle();
	expect(toggle).toBeChecked();

	await userEvent.click(toggle);
	expect(toggle).not.toBeChecked();

	await clickSave();
	await waitFor(() => expect(saveFn).toHaveBeenCalled());

	expect(saveFn.mock.calls[0][0]).toEqual(expect.objectContaining({ systemMessages: [] }));
});

it('should send selected systemMessages when user selects message types to hide', async () => {
	const saveFn = jest.fn((_data: Record<string, unknown>) => ({ rid: 'room-id', success: true }));
	const room = createRoom();

	render(<EditRoomInfo room={room} onClickClose={noop} onClickBack={noop} />, { wrapper: buildAppRoot(saveFn, room) });
	await openAdvancedSettings();

	const toggle = await findHideSysMesToggle();
	await userEvent.click(toggle);
	expect(toggle).toBeChecked();

	await selectSystemMessageOption('Message_HideType_au');

	await clickSave();
	await waitFor(() => expect(saveFn).toHaveBeenCalled());

	expect(saveFn.mock.calls[0][0]).toEqual(expect.objectContaining({ systemMessages: expect.arrayContaining(['au']) }));
});

it('should send existing systemMessages when toggle is turned ON without changing selection', async () => {
	const saveFn = jest.fn((_data: Record<string, unknown>) => ({ rid: 'room-id', success: true }));
	const room = createRoom();

	render(<EditRoomInfo room={room} onClickClose={noop} onClickBack={noop} />, { wrapper: buildAppRoot(saveFn, room) });
	await openAdvancedSettings();

	const toggle = await findHideSysMesToggle();
	expect(toggle).not.toBeChecked();

	await userEvent.click(toggle);
	expect(toggle).toBeChecked();

	await clickSave();
	await waitFor(() => expect(saveFn).toHaveBeenCalled());

	expect(saveFn.mock.calls[0][0]).toEqual(expect.objectContaining({ systemMessages: [] }));
});

it('should send updated systemMessages when only the multi-select is changed', async () => {
	const saveFn = jest.fn((_data: Record<string, unknown>) => ({ rid: 'room-id', success: true }));
	const room = createRoom(['ru']);

	render(<EditRoomInfo room={room} onClickClose={noop} onClickBack={noop} />, { wrapper: buildAppRoot(saveFn, room) });
	await openAdvancedSettings();

	const toggle = await findHideSysMesToggle();
	expect(toggle).toBeChecked();

	await removeSystemMessageChip('Message_HideType_ru');
	await selectSystemMessageOption('Message_HideType_au');

	await clickSave();
	await waitFor(() => expect(saveFn).toHaveBeenCalled());

	expect(saveFn.mock.calls[0][0]).toEqual(expect.objectContaining({ systemMessages: expect.arrayContaining(['au']) }));
});

it('should NOT send systemMessages when something else changed', async () => {
	const saveFn = jest.fn((_data: Record<string, unknown>) => ({ rid: 'room-id', success: true }));
	const room = createRoom(['au']);

	render(<EditRoomInfo room={room} onClickClose={noop} onClickBack={noop} />, { wrapper: buildAppRoot(saveFn, room) });

	await userEvent.type(await screen.findByRole('textbox', { name: 'Topic' }), 'new topic');

	await clickSave();
	await waitFor(() => expect(saveFn).toHaveBeenCalled());

	expect(saveFn.mock.calls[0][0]).not.toHaveProperty('systemMessages');
});
