import type { ILivechatTriggerCondition } from '@rocket.chat/core-typings';

import type { LivechatStoreState } from '../store';
import store from '../store';
import Triggers from './triggers';

export const pageUrlCondition = (condition: ILivechatTriggerCondition) => {
	const { parentUrl } = Triggers;

	if (!parentUrl || !condition.value) {
		return Promise.reject(`condition ${condition.name} not met`);
	}

	const hrefRegExp = new RegExp(`${condition?.value}`, 'g');

	if (hrefRegExp.test(parentUrl)) {
		return Promise.resolve({ condition: 'page-url' });
	}
};

export const timeOnSiteCondition = (condition: ILivechatTriggerCondition) => {
	return new Promise((resolve, reject) => {
		const timeout = parseInt(`${condition?.value || 0}`, 10) * 1000;
		const timeoutId = setTimeout(() => resolve({ condition: 'time-on-site' }), timeout);

		const watchStateChange = (event: [LivechatStoreState] | undefined) => {
			const [{ minimized = true }] = event || [{}];
			if (minimized) return;

			clearTimeout(timeoutId);
			store.off('change', watchStateChange);
			reject(`Condition "${condition.name}" is no longer valid`);
		};

		store.on('change', watchStateChange);
	});
};

export const chatOpenedCondition = () => {
	return new Promise((resolve) => {
		const openFunc = async () => {
			Triggers.callbacks?.off('chat-opened-by-visitor', openFunc);
			resolve({ condition: 'chat-opened-by-visitor' });
		};

		Triggers.callbacks?.on('chat-opened-by-visitor', openFunc);
	});
};

export const visitorRegisteredCondition = () => {
	return new Promise((resolve) => {
		const openFunc = async () => {
			Triggers.callbacks?.off('chat-visitor-registered', openFunc);
			resolve({ condition: 'after-guest-registration' });
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
