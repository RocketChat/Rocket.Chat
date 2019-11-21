import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../ui-cached-collection';
import Notifications from '../../notifications/client/lib/Notifications';
import { APIClient } from '../../utils';
import { modal } from '../../ui-utils/client/lib/modal';

const TRIGGER_TIMEOUT = 5000;
const MODAL_ACTIONS = ['modal', 'modal.open'];

const triggersId = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

const generateTriggerId = (appId) => {
	const triggerId = Random.id();
	triggersId.set(triggerId, appId);
	return triggerId;
};

const handlePayloadUserInteraction = (type, data) => {
	console.log(type, data);
	if (!triggersId.has(data.triggerId)) {
		return;
	}

	const appId = invalidateTriggerId(data.triggerId);

	if (MODAL_ACTIONS.includes(type)) {
		modal.push({
			template: 'ModalBlock',
			data: {
				appId,
				...data,
			},
		});
	}
};

export const triggerAction = async ({ appId, mid, ...payload }) => {
	const triggerId = generateTriggerId(appId);

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const { type, ...data } = await APIClient.post(`apps/blockit/${ appId }/`, { ...payload, messageId: mid, triggerId });
	return handlePayloadUserInteraction(type, data);
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onUser('interactions', ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		})
	)
);
