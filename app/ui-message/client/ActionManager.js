import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../ui-cached-collection';
import Notifications from '../../notifications/client/lib/Notifications';
import { APIClient } from '../../utils';
import { modal } from '../../ui-utils/client/lib/modal';

const TRIGGER_TIMEOUT = 5000;
const MODAL_ACTIONS = ['modal', 'modal.open'];

const triggersId = new Set();

const invalidateTriggerId = (id) => triggersId.delete(id);

const generateTriggerId = () => {
	const triggerId = Random.id();
	triggersId.add(triggerId);
	return triggerId;
};

const handlePayloadUserInteraction = (type, data) => {
	console.log(type, data);
	if (!triggersId.has(data.triggerId)) {
		return;
	}

	invalidateTriggerId(data.triggerId);

	if (MODAL_ACTIONS.includes(type)) {
		modal.push({
			template: 'ModalBlock',
			data,
		});
	}
};

export const triggerAction = async ({ appId, ...payload }) => {
	const triggerId = generateTriggerId();

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const { type, ...data } = await APIClient.post(`apps/blockit/${ appId }/`, { ...payload, triggerId });
	return handlePayloadUserInteraction(type, data);
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onUser('interactions', ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		})
	)
);
