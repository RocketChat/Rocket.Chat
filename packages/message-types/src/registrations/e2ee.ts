import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'room_e2e_enabled',
		system: true,
		text: (t) => t('Enabled_E2E_Encryption_for_this_room'),
	});

	instance.registerType({
		id: 'room_e2e_disabled',
		system: true,
		text: (t) => t('Disabled_E2E_Encryption_for_this_room'),
	});

	instance.registerType({
		id: 'message_pinned_e2e',
		system: true,
		text: (t) => t('Pinned_a_message'),
	});
};
