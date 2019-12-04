import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../ui-cached-collection';
import Notifications from '../../notifications/client/lib/Notifications';
import { APIClient } from '../../utils';
import { modal } from '../../ui-utils/client/lib/modal';

const TRIGGER_TIMEOUT = 5000;

const ACTION_TYPES = {
	ACTION: 'blockAction',
	SUBMIT: 'viewSubmit',
	CANCEL: 'viewCancel',
};

const MODAL_ACTIONS = ['modal', 'modal.open'];

const triggersId = new Map();

const instances = new Map();

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

const handlePayloadUserInteraction = (type, { appId, viewId, triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}

	if (appId !== invalidateTriggerId(triggerId)) {
		return;
	}

	if (MODAL_ACTIONS.includes(type) && viewId) {
		const instance = modal.push({
			template: 'ModalBlock',
			data: {
				triggerId,
				viewId,
				appId,
				...data,
			},
		});
		instances.set(viewId, instance);
		return instance;
	}
};

export const triggerAction = async ({ type, appId, mid, ...payload }) => {
	const triggerId = generateTriggerId(appId);

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const { type: interactionType, ...data } = await APIClient.post(`apps/blockit/${ appId }/`, { type, payload, messageId: mid, triggerId });
	return handlePayloadUserInteraction(interactionType, data);
};

export const triggerBlockAction = (options) => triggerAction({ type: ACTION_TYPES.ACTION, ...options });
export const triggerSubmitView = async ({ viewId, ...options }) => {
	const instance = instances.get(viewId);
	try {
		await triggerAction({ type: ACTION_TYPES.SUBMIT, ...options });
	} finally {
		if (instance) {
			instance.close();
			instances.delete(viewId);
		}
	}
};
export const triggerCancel = async ({ viewId, ...options }) => {
	const instance = instances.get(viewId);
	try {
		await triggerAction({ type: ACTION_TYPES.CANCEL, ...options });
	} finally {
		if (instance) {
			instance.close();
			instances.delete(viewId);
		}
	}
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onUser('interactions', ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		})
	)
);
