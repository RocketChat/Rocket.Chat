import { Livechat } from '../api';
import { createRandomId } from './random';

export const UIKitInteractionType = {
	MODAL_OPEN: 'modal.open',
	MODAL_CLOSE: 'modal.close',
	MODAL_UPDATE: 'modal.update',
	ERRORS: 'errors',
};

export const UIKitIncomingInteractionType = {
	BLOCK: 'blockAction',
	VIEW_SUBMIT: 'viewSubmit',
	VIEW_CLOSED: 'viewClosed',
};

export const UIKitIncomingInteractionContainerType = {
	MESSAGE: 'message',
	VIEW: 'view',
};

const TRIGGER_TIMEOUT = 5000;

const triggersId = new Map();

// const instances = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

const generateTriggerId = (appId) => {
	const triggerId = createRandomId();
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
		// events.emit(viewId, {
		// 	type,
		// 	triggerId,
		// 	viewId,
		// 	appId,
		// 	...data,
		// });
		return UIKitInteractionType.ERRORS;
	}

	if ([UIKitInteractionType.MODAL_UPDATE].includes(type)) {
		// events.emit(viewId, {
		// 	type,
		// 	triggerId,
		// 	viewId,
		// 	appId,
		// 	...data,
		// });
		return UIKitInteractionType.MODAL_UPDATE;
	}

	if ([UIKitInteractionType.MODAL_OPEN].includes(type)) {
		// const instance = modal.push({
		// 	template: 'ModalBlock',
		// 	modifier: 'uikit',
		// 	closeOnEscape: false,
		// 	data: {
		// 		triggerId,
		// 		viewId,
		// 		appId,
		// 		...data,
		// 	},
		// });
		// instances.set(viewId, instance);
		return UIKitInteractionType.MODAL_OPEN;
	}

	return UIKitInteractionType.MODAL_ClOSE;
};

export const triggerAction = async ({ appId, type, actionId, rid, mid, viewId, container, payload }) => {
	const triggerId = generateTriggerId(appId);

	try {
		const params = {
			type,
			actionId,
			rid,
			mid,
			viewId,
			container,
			triggerId,
			payload,
		};

		const result = await Promise.race([
			fetch(`${Livechat.client.host}/api/${encodeURI(`apps/ui.interaction/${appId}`)}`, {
				method: 'POST',
				body: Livechat.client.getBody(params),
				headers: Object.assign({ 'x-visitor-token': Livechat.credentials.token }, Livechat.client.getHeaders()),
			}).then(Livechat.client.handle),
			new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error(triggerId));
				}, TRIGGER_TIMEOUT);
			}),
		]);

		const { type: interactionType, ...data } = result;

		return handlePayloadUserInteraction(interactionType, data);
	} catch (error) {
		invalidateTriggerId(triggerId);
		throw error;
	}
};
