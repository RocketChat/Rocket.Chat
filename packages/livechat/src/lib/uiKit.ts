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

const triggersId = new Map<string, string>();

// const instances = new Map();

const invalidateTriggerId = (id: string) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

const generateTriggerId = (appId: string) => {
	const triggerId = createRandomId();
	triggersId.set(triggerId, appId);
	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);
	return triggerId;
};

const handlePayloadUserInteraction = (type: string, { /* appId,*/ triggerId, ...data }: Record<string, any>) => {
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

	return UIKitInteractionType.MODAL_CLOSE;
};

type TriggerActionParams = {
	appId: string;
	type: string;
	actionId?: string;
	rid?: string;
	mid?: string;
	viewId?: string | null;
	container?: unknown;
	payload?: unknown;
};

export const triggerAction = async ({ appId, type, actionId, rid, mid, viewId, container, payload }: TriggerActionParams) => {
	const triggerId = generateTriggerId(appId);

	try {
		const result = await Promise.race([
			Livechat.sendUiInteraction(
				{
					type,
					actionId,
					rid,
					mid,
					viewId,
					container,
					triggerId,
					payload,
				} as Parameters<typeof Livechat.sendUiInteraction>[0],
				appId,
			),

			new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error(triggerId));
				}, TRIGGER_TIMEOUT);
			}),
		]);

		const { type: interactionType, ...data } = result as Record<string, any>;

		return handlePayloadUserInteraction(interactionType, data);
	} catch (error) {
		invalidateTriggerId(triggerId);
		throw error;
	}
};
