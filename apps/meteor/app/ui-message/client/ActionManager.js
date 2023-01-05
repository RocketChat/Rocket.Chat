import { UIKitIncomingInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Random } from 'meteor/random';
import { Emitter } from '@rocket.chat/emitter';
import { UIKitInteractionTypes } from '@rocket.chat/core-typings';

import Notifications from '../../notifications/client/lib/Notifications';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { modal } from '../../ui-utils/client/lib/modal';
import { APIClient, t } from '../../utils/client';
import * as banners from '../../../client/lib/banners';
import { dispatchToastMessage } from '../../../client/lib/toast';

const events = new Emitter();

export const on = (...args) => {
	events.on(...args);
};

export const off = (...args) => {
	events.off(...args);
};

const TRIGGER_TIMEOUT = 5000;

const TRIGGER_TIMEOUT_ERROR = 'TRIGGER_TIMEOUT_ERROR';

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

	if ([UIKitInteractionTypes.ERRORS].includes(type)) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return UIKitInteractionTypes.ERRORS;
	}

	if (
		[UIKitInteractionTypes.BANNER_UPDATE, UIKitInteractionTypes.MODAL_UPDATE, UIKitInteractionTypes.CONTEXTUAL_BAR_UPDATE].includes(type)
	) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return type;
	}

	if ([UIKitInteractionTypes.MODAL_OPEN].includes(type)) {
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

		instances.set(viewId, {
			close() {
				instance.close();
				instances.delete(viewId);
			},
		});

		return UIKitInteractionTypes.MODAL_OPEN;
	}

	if ([UIKitInteractionTypes.CONTEXTUAL_BAR_OPEN].includes(type)) {
		instances.set(viewId, {
			payload: {
				type,
				triggerId,
				appId,
				viewId,
				...data,
			},
			close() {
				instances.delete(viewId);
			},
		});

		FlowRouter.setParams({ tab: 'app', context: viewId });

		return UIKitInteractionTypes.CONTEXTUAL_BAR_OPEN;
	}

	if ([UIKitInteractionTypes.BANNER_OPEN].includes(type)) {
		banners.open(data);
		instances.set(viewId, {
			close() {
				banners.closeById(viewId);
			},
		});
		return UIKitInteractionTypes.BANNER_OPEN;
	}

	if ([UIKitIncomingInteractionType.BANNER_CLOSE].includes(type)) {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
		return UIKitIncomingInteractionType.BANNER_CLOSE;
	}

	if ([UIKitIncomingInteractionType.CONTEXTUAL_BAR_CLOSE].includes(type)) {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
		return UIKitIncomingInteractionType.CONTEXTUAL_BAR_CLOSE;
	}

	return UIKitInteractionTypes.MODAL_ClOSE;
};

export const triggerAction = async ({ type, actionId, appId, rid, mid, viewId, container, ...rest }) =>
	new Promise(async (resolve, reject) => {
		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		setTimeout(reject, TRIGGER_TIMEOUT, [TRIGGER_TIMEOUT_ERROR, { triggerId, appId }]);

		const { type: interactionType, ...data } = await (async () => {
			try {
				return await APIClient.post(`/apps/ui.interaction/${appId}`, {
					type,
					actionId,
					payload,
					container,
					mid,
					rid,
					triggerId,
					viewId,
				});
			} catch (e) {
				reject(e);
				return {};
			}
		})();

		return resolve(handlePayloadUserInteraction(interactionType, data));
	});

export const triggerBlockAction = (options) => triggerAction({ type: UIKitIncomingInteractionType.BLOCK, ...options });

export const triggerActionButtonAction = (options) =>
	triggerAction({ type: UIKitIncomingInteractionType.ACTION_BUTTON, ...options }).catch(async (reason) => {
		if (Array.isArray(reason) && reason[0] === TRIGGER_TIMEOUT_ERROR) {
			dispatchToastMessage({
				type: 'error',
				message: t('UIKit_Interaction_Timeout'),
			});
		}
	});

export const triggerSubmitView = async ({ viewId, ...options }) => {
	const close = () => {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
	};

	try {
		const result = await triggerAction({
			type: UIKitIncomingInteractionType.VIEW_SUBMIT,
			viewId,
			...options,
		});
		if (!result || UIKitInteractionTypes.MODAL_CLOSE === result) {
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
		}
	}
};

export const getUserInteractionPayloadByViewId = (viewId) => {
	if (!viewId) {
		throw new Error('No viewId provided when checking for `user interaction payload`');
	}

	const instance = instances.get(viewId);

	if (!instance) {
		return {};
	}

	return instance.payload;
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onUser('uiInteraction', ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		}),
	),
);
