import { isVoipMessage } from '@rocket.chat/core-typings';
import moment from 'moment';

import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'voip-call-started',
		system: true,
		text: (t) => t('Voip_call_started'),
	});

	instance.registerType({
		id: 'voip-call-duration',
		system: true,
		text: (t, message) => {
			if (!isVoipMessage(message)) {
				return t('Voip_call_duration', { duration: '' });
			}
			const seconds = (message.voipData.callDuration || 0) / 1000;
			const duration = moment.duration(seconds, 'seconds').humanize();
			return t('Voip_call_duration', { duration });
		},
	});

	instance.registerType({
		id: 'voip-call-declined',
		system: true,
		text: (t) => t('Voip_call_declined'),
	});

	instance.registerType({
		id: 'voip-call-on-hold',
		system: true,
		text: (t) => t('Voip_call_on_hold'),
	});

	instance.registerType({
		id: 'voip-call-unhold',
		system: true,
		text: (t) => t('Voip_call_unhold'),
	});

	instance.registerType({
		id: 'voip-call-ended',
		system: true,
		text: (t) => t('Voip_call_ended'),
	});

	instance.registerType({
		id: 'voip-call-ended-unexpectedly',
		system: true,
		text: (t, message) => t('Voip_call_ended_unexpectedly', { reason: message.msg }),
	});

	instance.registerType({
		id: 'voip-call-wrapup',
		system: true,
		text: (t, message) => t('Voip_call_wrapup', { comment: message.msg }),
	});
};
