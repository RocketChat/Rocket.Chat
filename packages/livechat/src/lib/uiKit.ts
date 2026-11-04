import { h } from 'preact';

import { createRandomId } from './random';
import { Livechat } from '../api';
import { UiKitModal, type UiKitModalView } from '../components/uiKit/modal';
import store from '../store';

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

type OpenView = { appId: string; view: UiKitModalView; errors?: Record<string, string> };

const openViews = new Map<string, OpenView>();

const closeModal = (viewId: string) => {
	if (openViews.delete(viewId)) {
		store.setState({ modal: null });
	}
};

const showModal = (viewId: string, openView: OpenView) => {
	openViews.set(viewId, openView);
	const { appId, view, errors } = openView;

	const finish = async (type: string, payload: Record<string, unknown>) => {
		let result: string | undefined;
		try {
			result = await triggerAction({
				appId,
				type,
				viewId,
				container: { type: UIKitIncomingInteractionContainerType.VIEW, id: viewId },
				payload,
			});
		} catch {
			// A failed or unanswered interaction leaves nothing to wait for, so the modal goes away.
		}

		if (
			type === UIKitIncomingInteractionType.VIEW_CLOSED ||
			![UIKitInteractionType.ERRORS, UIKitInteractionType.MODAL_UPDATE, UIKitInteractionType.MODAL_OPEN].includes(result ?? '')
		) {
			closeModal(viewId);
		} else if (result === UIKitInteractionType.MODAL_OPEN && openViews.get(viewId) === openView) {
			// The app replaced this view with another one, which already took the modal's place.
			openViews.delete(viewId);
		}
	};

	store.setState({
		modal: h(UiKitModal, {
			key: viewId,
			appId,
			view,
			errors,
			dispatchBlockAction: ({ actionId, payload }) =>
				triggerAction({
					appId,
					type: UIKitIncomingInteractionType.BLOCK,
					actionId,
					viewId,
					container: { type: UIKitIncomingInteractionContainerType.VIEW, id: viewId },
					payload,
				}),
			onSubmit: (state) => finish(UIKitIncomingInteractionType.VIEW_SUBMIT, { view, state }),
			onClose: (state) => finish(UIKitIncomingInteractionType.VIEW_CLOSED, { view: { ...view, state }, isCleared: false }),
		}),
	});
};

export const handlePayloadUserInteraction = (type: string, { triggerId, ...data }: Record<string, any>) => {
	if (!triggersId.has(triggerId)) {
		return;
	}
	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	const { view } = data;
	let { viewId } = data;

	if (view?.id) {
		viewId = view.id;
	}

	if (!viewId) {
		return;
	}

	const openView = openViews.get(viewId);

	if (type === UIKitInteractionType.ERRORS) {
		if (openView) {
			showModal(viewId, { ...openView, errors: data.errors });
		}
		return UIKitInteractionType.ERRORS;
	}

	if (type === UIKitInteractionType.MODAL_UPDATE) {
		showModal(viewId, { appId, view: { ...openView?.view, ...view }, errors: undefined });
		return UIKitInteractionType.MODAL_UPDATE;
	}

	if (type === UIKitInteractionType.MODAL_OPEN) {
		showModal(viewId, { appId, view });
		return UIKitInteractionType.MODAL_OPEN;
	}

	closeModal(viewId);
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
