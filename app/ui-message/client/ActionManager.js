import { UIKitInteractionType, UIKitIncomingInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Emitter } from '@rocket.chat/emitter';

import Notifications from '../../notifications/client/lib/Notifications';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { modal } from '../../ui-utils/client/lib/modal';
import { APIClient } from '../../utils';

const events = new Emitter();

export const on = (...args) => {
	events.on(...args);
};

export const off = (...args) => {
	events.off(...args);
};

const TRIGGER_TIMEOUT = 5000;

const triggersId = new Map();

const instances = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const generateTriggerId = (appId) => {
	const triggerId = Random.id();
	triggersId.set(triggerId, appId);
	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);
	return triggerId;
};

const handlePayloadUserInteraction = (type, { /* appId,*/ triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}
	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	const { view } = data;
	let { viewId } = data;

	if (view && view.id) {
		viewId = view.id;
	}

	if (!viewId) {
		return;
	}

	if ([UIKitInteractionType.ERRORS].includes(type)) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return UIKitInteractionType.ERRORS;
	}

	if ([UIKitInteractionType.MODAL_UPDATE].includes(type)) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return UIKitInteractionType.MODAL_UPDATE;
	}

	if ([UIKitInteractionType.MODAL_OPEN].includes(type)) {
		const instance = modal.push({
			template: 'ModalBlock',
			modifier: 'uikit',
			closeOnEscape: false,
			data: {
				triggerId,
				viewId,
				appId,
				...data,
			},
		});
		instances.set(viewId, instance);
		return UIKitInteractionType.MODAL_OPEN;
	}

	return UIKitInteractionType.MODAL_ClOSE;
};

export const triggerAction = async ({ type, actionId, appId, rid, mid, viewId, container, ...rest }) => new Promise(async (resolve, reject) => {
	const triggerId = generateTriggerId(appId);

	const payload = rest.payload || rest;

	setTimeout(reject, TRIGGER_TIMEOUT, triggerId);

	const { type: interactionType, ...data } = await APIClient.post(
		`apps/ui.interaction/${ appId }`,
		{ type, actionId, payload, container, mid, rid, triggerId, viewId },
	);

	return resolve(handlePayloadUserInteraction(interactionType, data));
});

export const triggerBlockAction = (options) => triggerAction({ type: UIKitIncomingInteractionType.BLOCK, ...options });
export const triggerSubmitView = async ({ viewId, ...options }) => {
	const close = () => {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
			instances.delete(viewId);
		}
	};

	try {
		const result = await triggerAction({ type: UIKitIncomingInteractionType.VIEW_SUBMIT, viewId, ...options });
		if (!result || UIKitInteractionType.MODAL_CLOSE === result) {
			close();
		}
	} catch {
		close();
	}
};
export const triggerCancel = async ({ view, ...options }) => {
	const instance = instances.get(view.id);
	try {
		await triggerAction({ type: UIKitIncomingInteractionType.VIEW_CLOSED, view, ...options });
	} finally {
		if (instance) {
			instance.close();
			instances.delete(view.id);
		}
	}
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onUser('uiInteraction', ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		}),
	),
);
