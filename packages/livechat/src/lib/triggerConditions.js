import store from '../store';
import Triggers from './triggers';

export const pageUrlCondition = (condition) => {
	const { parentUrl } = Triggers;

	if (!parentUrl) {
		return Promise.reject(`condition ${condition.name} not met`);
	}

	const hrefRegExp = new RegExp(condition.value, 'g');

	if (hrefRegExp.test(parentUrl)) {
		return Promise.resolve();
	}
};

export const timeOnSiteCondition = (condition) => {
	return new Promise((resolve, reject) => {
		const timeout = parseInt(condition.value, 10) * 1000;
		const timeoutId = setTimeout(() => resolve(), timeout);

		const watchStateChange = ([{ minimized = true }]) => {
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
			Triggers.callbacks.off('chat-opened-by-visitor', openFunc);
			resolve();
		};

		Triggers.callbacks.on('chat-opened-by-visitor', openFunc);
	});
};

export const visitorRegisteredCondition = () => {
	return new Promise((resolve) => {
		const openFunc = async () => {
			Triggers.callbacks.off('chat-visitor-registered', openFunc);
			resolve({ scope: 'after-registration' });
		};

		Triggers.callbacks.on('chat-visitor-registered', openFunc);
	});
};

export const conditions = {
	'page-url': pageUrlCondition,
	'time-on-site': timeOnSiteCondition,
	'chat-opened-by-visitor': chatOpenedCondition,
	'after-guest-registration': visitorRegisteredCondition,
};
