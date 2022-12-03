import parseISO from 'date-fns/parseISO';
import mem from 'mem';
import { Component } from 'preact';

import { Livechat, useSsl } from '../api';
import store from '../store';

export function flatMap(arr, mapFunc) {
	const result = [];
	for (const [index, elem] of arr.entries()) {
		const x = mapFunc(elem, index, arr);
		// We allow mapFunc() to return non-Arrays
		if (Array.isArray(x)) {
			result.push(...x);
		} else {
			result.push(x);
		}
	}
	return result;
}

export const createClassName = (styles, elementName, modifiers = {}, classes = []) =>
	[
		styles[elementName],
		...flatMap(Object.entries(modifiers), ([modifierKey, modifierValue]) => [
			modifierValue && styles[`${elementName}--${modifierKey}`],
			typeof modifierValue !== 'boolean' && styles[`${elementName}--${modifierKey}-${modifierValue}`],
		]).filter((className) => !!className),
		...classes.filter((className) => !!className),
	].join(' ');

export async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		// eslint-disable-next-line no-await-in-loop
		await callback(array[index], index, array);
	}
}

export async function asyncEvery(array, callback) {
	for (let index = 0; index < array.length; index++) {
		// eslint-disable-next-line no-await-in-loop
		if (!(await callback(array[index], index, array))) {
			return false;
		}
	}
	return true;
}

export const debounce = (func, delay) => {
	let inDebounce;

	function f(...args) {
		const context = this;
		clearTimeout(inDebounce);
		inDebounce = setTimeout(() => func.apply(context, args), delay);
		return context;
	}

	f.stop = () => clearTimeout(inDebounce);

	return f;
};

export const throttle = (func, limit) => {
	let inThrottle;
	return function (...args) {
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
};

export function getInsertIndex(array, item, ranking) {
	const order = ranking(item);
	let min = 0;
	let max = array.length - 1;

	while (min <= max) {
		const guess = Math.floor((min + max) / 2);
		const guessedOrder = ranking(array[guess]);
		if (guessedOrder < order) {
			min = guess + 1;
		} else if (guessedOrder > array[guess + 1]) {
			return guess;
		} else {
			max = guess - 1;
		}
	}

	return array.length > 0 ? array.length : 0;
}

export function upsert(array = [], item, predicate, ranking) {
	const index = array.findIndex(predicate);

	if (index > -1) {
		array[index] = item;
		return array;
	}

	array.splice(getInsertIndex(array, item, ranking), 0, item);
	return array;
}

// This will allow widgets that are on different domains to send cookies to the server
// The default config for same-site (lax) dissalows to send a cookie to a "3rd party" unless the user performs an action
// like a click. Secure flag is required when SameSite is set to None
const getSecureCookieSettings = () => (useSsl ? 'SameSite=None; Secure;' : '');

export const setInitCookies = () => {
	document.cookie = `rc_is_widget=t; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_room_type=l; path=/; ${getSecureCookieSettings()}`;
};

export const setCookies = (rid, token) => {
	document.cookie = `rc_rid=${rid}; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_token=${token}; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_room_type=l; path=/; ${getSecureCookieSettings()}`;
};

export const getAvatarUrl = (username) => (username ? `${Livechat.client.host}/avatar/${username}` : null);

export const msgTypesNotRendered = ['livechat_video_call', 'livechat_navigation_history', 'au', 'command', 'uj', 'ul', 'livechat-close'];

export const canRenderMessage = ({ t }) => !msgTypesNotRendered.includes(t);

export const getAttachmentUrl = (url) => new URL(url, Livechat.client.host).toString();

export const sortArrayByColumn = (array, column, inverted) =>
	array.sort((a, b) => {
		if (a[column] < b[column] && !inverted) {
			return -1;
		}
		return 1;
	});

export const normalizeTransferHistoryMessage = (transferData, sender, t) => {
	if (!transferData) {
		return;
	}

	const { transferredBy, transferredTo, nextDepartment, scope, comment } = transferData;
	const from = transferredBy && (transferredBy.name || transferredBy.username);

	const transferTypes = {
		agent: () => {
			if (!sender.username) {
				return t('the_chat_was_transferred_to_another_agent');
			}
			const to = transferredTo && (transferredTo.name || transferredTo.username);
			return t('from_transferred_the_chat_to_to', { from, to });
		},
		department: () => {
			const to = nextDepartment && nextDepartment.name;

			if (!sender.username) {
				return t('the_agent_transferred_the_chat_to_the_department_to', { to });
			}

			return t('from_transferred_the_chat_to_the_department_to', { from, to });
		},
		queue: () => {
			if (!sender.username) {
				return t('the_chat_was_moved_back_to_queue');
			}
			return t('from_returned_the_chat_to_the_queue', { from });
		},
		autoTransferUnansweredChatsToAgent: () => t('the_chat_was_transferred_to_another_agent_due_to_unanswered', { duration: comment }),
		autoTransferUnansweredChatsToQueue: () => t('the_chat_was_moved_back_to_queue_due_to_unanswered', { duration: comment }),
	};

	return transferTypes[scope]();
};

export const parseOfflineMessage = (fields = {}) => {
	const host = window.location.origin;
	return Object.assign(fields, { host });
};
export const normalizeDOMRect = ({ left, top, right, bottom }) => ({ left, top, right, bottom });

export const visibility = (() => {
	if (typeof document.hidden !== 'undefined') {
		return {
			get hidden() {
				return document.hidden;
			},
			addListener: (f) => document.addEventListener('visibilitychange', f, false),
			removeListener: (f) => document.removeEventListener('visibilitychange', f, false),
		};
	}

	if (typeof document.msHidden !== 'undefined') {
		return {
			get hidden() {
				return document.msHidden;
			},
			addListener: (f) => document.addEventListener('msvisibilitychange', f, false),
			removeListener: (f) => document.removeEventListener('msvisibilitychange', f, false),
		};
	}

	if (typeof document.webkitHidden !== 'undefined') {
		return {
			get hidden() {
				return document.webkitHidden;
			},
			addListener: (f) => document.addEventListener('webkitvisibilitychange', f, false),
			removeListener: (f) => document.removeEventListener('webkitvisibilitychange', f, false),
		};
	}

	return {
		hidden: true,
		addListener: () => {},
		removeListener: () => {},
	};
})();

export class MemoizedComponent extends Component {
	shouldComponentUpdate(nextProps) {
		const { props } = this;

		for (const key in props) {
			if (props[key] !== nextProps[key]) {
				return true;
			}
		}

		for (const key in nextProps) {
			if (!(key in props)) {
				return true;
			}
		}

		return false;
	}
}

export const memo = (component) =>
	class extends MemoizedComponent {
		render = component;
	};

export const isActiveSession = () => {
	const sessionId = sessionStorage.getItem('sessionId');
	const { openSessionIds: [firstSessionId] = [] } = store.state;

	return sessionId === firstSessionId;
};

export const isMobileDevice = () => window.innerWidth <= 800 && window.innerHeight >= 630;

export const resolveDate = (dateInput) => {
	switch (typeof dateInput) {
		case Date: {
			return dateInput;
		}
		case 'object': {
			return new Date(dateInput.$date);
		}
		case 'string': {
			return parseISO(dateInput);
		}
		default: {
			return new Date(dateInput);
		}
	}
};

const escapeMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'`': '&#x60;',
};

const escapeRegex = new RegExp(`(?:${Object.keys(escapeMap).join('|')})`, 'g');

const escapeHtml = mem((string) => string.replace(escapeRegex, (match) => escapeMap[match]));

export const parse = (plainText) => [{ plain: plainText }].map(({ plain, html }) => (plain ? escapeHtml(plain) : html || '')).join('');
