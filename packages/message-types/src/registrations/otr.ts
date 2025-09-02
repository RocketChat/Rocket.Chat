import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'user_joined_otr',
		system: true,
		text: (t) => t('user_joined_otr'),
	});

	instance.registerType({
		id: 'user_requested_otr_key_refresh',
		system: true,
		text: (t) => t('user_requested_otr_key_refresh'),
	});

	instance.registerType({
		id: 'user_key_refreshed_successfully',
		system: true,
		text: (t) => t('user_key_refreshed_successfully'),
	});
};
