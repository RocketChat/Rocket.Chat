import type { ILivechatTriggerCondition } from '@rocket.chat/core-typings';

import store from '../store';
import Triggers from './triggers';

export const pageUrlCondition = (condition: ILivechatTriggerCondition) => {
	const { parentUrl } = Triggers;

	if (!parentUrl || !condition.value) {
		// oxlint-disable-next-line typescript/prefer-promise-reject-errors -- the reason is persisted to triggersRecords and logged as-is; an Error would serialize to {}
		return Promise.reject(`condition ${condition.name} not met`);
	}

	const hrefRegExp = new RegExp(`${condition?.value}`, 'g');

	if (hrefRegExp.test(parentUrl)) {
		return Promise.resolve();
	}

	// oxlint-disable-next-line typescript/prefer-promise-reject-errors -- keeps the existing reasonless rejection: callers only need to know the condition failed
	return Promise.reject();
};

export const timeOnSiteCondition = (condition: ILivechatTriggerCondition) => {
	return new Promise<void>((resolve, reject) => {
		const timeout = parseInt(`${condition?.value || 0}`, 10) * 1000;
		setTimeout(() => {
			const { user } = store.state;
			if (user?.token) {
				// oxlint-disable-next-line typescript/prefer-promise-reject-errors -- the reason is persisted to triggersRecords and logged as-is; an Error would serialize to {}
				reject(`Condition "${condition.name}" is no longer valid`);
				return;
			}

			resolve();
		}, timeout);
	});
};

export const chatOpenedCondition = () => {
	return new Promise<void>((resolve) => {
		const openFunc = async () => {
			Triggers.callbacks?.off('chat-opened-by-visitor', openFunc);
			resolve();
		};

		Triggers.callbacks?.on('chat-opened-by-visitor', openFunc);
	});
};

export const visitorRegisteredCondition = () => {
	return new Promise<void>((resolve) => {
		const openFunc = async () => {
			Triggers.callbacks?.off('chat-visitor-registered', openFunc);
			resolve();
		};

		Triggers.callbacks?.on('chat-visitor-registered', openFunc);
	});
};

export const conditions = {
	'page-url': pageUrlCondition,
	'time-on-site': timeOnSiteCondition,
	'chat-opened-by-visitor': chatOpenedCondition,
	'after-guest-registration': visitorRegisteredCondition,
};
