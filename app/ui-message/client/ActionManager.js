import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import EventEmitter from 'wolfy87-eventemitter';

import { CachedCollectionManager } from '../../ui-cached-collection';
import Notifications from '../../notifications/client/lib/Notifications';
import { APIClient } from '../../utils';
import { modal } from '../../ui-utils/client/lib/modal';

const events = new EventEmitter();

export const on = (...args) => {
	events.on(...args);
};

export const off = (...args) => {
	events.off(...args);
};

const TRIGGER_TIMEOUT = 5000;

const ACTION_TYPES = {
	ACTION: 'blockAction',
	SUBMIT: 'viewSubmit',
	CANCEL: 'viewCancel',
};

const MODAL_ACTIONS = {
	OPEN: 'modal',
	CLOSE: 'modal.close',
	UPDATE: 'modal.update',
};

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

const handlePayloadUserInteraction = (type, { /* appId,*/ viewId = 'lero', triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}
	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	if (!viewId) {
		return;
	}

	if ([MODAL_ACTIONS.UPDATE].includes(type)) {
		return events.emit(viewId, {
			triggerId,
			viewId,
			appId: appId || data.blocks[0].appId, // TODO REMOVE GAMBA
			...data,
		});
	}

	if ([MODAL_ACTIONS.OPEN].includes(type)) {
		const instance = modal.push({
			template: 'ModalBlock',
			data: {
				triggerId,
				viewId,
				appId: appId || data.blocks[0].appId, // TODO REMOVE GAMBA
				...data,
			},
		});
		instances.set(viewId, instance);
		return instance;
	}
};

export const triggerAction = async ({ type, actionId, appId, rid, mid, ...rest }) => {
	const triggerId = generateTriggerId(appId);

	const payload = rest.payload || rest;

	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);

	const { type: interactionType, ...data } = await APIClient.post(`apps/blockit/${ appId }/`, { type, actionId, payload, mid, rid, triggerId });
	return handlePayloadUserInteraction(interactionType, data);
};

export const triggerBlockAction = (options) => triggerAction({ type: ACTION_TYPES.ACTION, ...options });
export const triggerSubmitView = async ({ viewId, ...options }) => {
	const instance = instances.get(viewId);
	try {
		await triggerAction({ type: ACTION_TYPES.SUBMIT, viewId, ...options });
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
		await triggerAction({ type: ACTION_TYPES.CANCEL, viewId, ...options });
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
