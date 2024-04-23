import i18next from 'i18next';

import { Livechat } from '../api';
import { store } from '../store';
import CustomFields from './customFields';
import { loadConfig, updateBusinessUnit } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { loadMessages } from './room';
import Triggers from './triggers';

const evaluateChangesAndLoadConfigByFields = async (fn) => {
	const oldStore = JSON.parse(
		JSON.stringify({
			user: store.state.user || {},
			department: store.state.department,
			token: store.state.token,
		}),
	);
	await fn();

	/**
	 * it solves the issues where the registerGuest is called every time the widget is opened
	 * and the guest is already registered. If there is nothing different in the data,
	 * it will not call the loadConfig again.
	 *
	 * if user changes, it will call loadConfig
	 * if department changes, it will call loadConfig
	 * if token changes, it will call loadConfig
	 */

	if (oldStore.user._id !== store.state.user?._id) {
		await loadConfig();
		await loadMessages();
		return;
	}

	if (oldStore.department !== store.state.department) {
		await loadConfig();
		await loadMessages();
		return;
	}

	if (oldStore.token !== store.state.token) {
		await loadConfig();
		await loadMessages();
	}
};

const createOrUpdateGuest = async (guest) => {
	const { token } = guest;
	token && (await store.setState({ token }));
	const { visitor: user } = await Livechat.grantVisitor({ visitor: { ...guest } });
	store.setState({ user });
};

const updateIframeGuestData = (data) => {
	const {
		iframe,
		iframe: { guest },
		user: _id,
		token,
	} = store.state;
	store.setState({ iframe: { ...iframe, guest: { ...guest, ...data } } });

	if (!_id) {
		return;
	}

	const guestData = { token, ...data };
	createOrUpdateGuest(guestData);
};

const api = {
	pageVisited(info) {
		if (info.change === 'url') {
			Triggers.processRequest(info);
		}

		const { token, room } = store.state;
		const { _id: rid } = room || {};

		const {
			change,
			title,
			location: { href },
		} = info;

		Livechat.sendVisitorNavigation({ token, rid, pageInfo: { change, title, location: { href } } });
	},

	setCustomField(key, value, overwrite = true) {
		CustomFields.setCustomField(key, value, overwrite);
	},

	setTheme({ color, fontColor, iconColor, title, offlineTitle } = {}) {
		const {
			iframe,
			iframe: { theme },
		} = store.state;
		store.setState({
			iframe: {
				...iframe,
				theme: {
					...theme,
					color,
					fontColor,
					iconColor,
					title,
					offlineTitle,
				},
			},
		});
	},

	setDepartment: async (value) => {
		await evaluateChangesAndLoadConfigByFields(async () => api._setDepartment(value));
	},

	async _setDepartment(value) {
		const {
			config: { departments = [] },
			defaultAgent,
		} = store.state;

		const department = departments.find((dep) => dep._id === value || dep.name === value)?._id || '';

		updateIframeGuestData({ department });
		store.setState({ department });

		if (defaultAgent && defaultAgent.department !== department) {
			store.setState({ defaultAgent: null });
		}
	},

	async setBusinessUnit(newBusinessUnit) {
		if (!newBusinessUnit || !newBusinessUnit.trim().length) {
			throw new Error('Error! Invalid business ids');
		}

		const { businessUnit: existingBusinessUnit } = store.state;

		return existingBusinessUnit !== newBusinessUnit && updateBusinessUnit(newBusinessUnit);
	},

	async clearBusinessUnit() {
		const { businessUnit } = store.state;
		return businessUnit && updateBusinessUnit();
	},

	clearDepartment() {
		updateIframeGuestData({ department: '' });
	},

	setAgent({ _id, username, ...props } = {}) {
		if (!_id || !username) {
			return console.warn('The fields _id and username are mandatory.');
		}

		store.setState({
			defaultAgent: {
				_id,
				username,
				ts: Date.now(),
				...props,
			},
		});
	},

	setExpanded(expanded) {
		store.setState({ expanded });
	},

	async setGuestToken(token) {
		const { token: localToken } = store.state;
		if (token === localToken) {
			return;
		}
		await evaluateChangesAndLoadConfigByFields(async () => {
			await createOrUpdateGuest({ token });
		});
	},

	setGuestName(name) {
		updateIframeGuestData({ name });
	},

	setGuestEmail(email) {
		updateIframeGuestData({ email });
	},

	async registerGuest(data) {
		if (!data || typeof data !== 'object') {
			return;
		}

		await evaluateChangesAndLoadConfigByFields(async () => {
			if (!data.token) {
				data.token = createToken();
			}

			if (data.department) {
				await api._setDepartment(data.department);
			}

			Livechat.unsubscribeAll();

			await createOrUpdateGuest(data);
		});
	},

	async setLanguage(language) {
		const { iframe } = store.state;
		await store.setState({ iframe: { ...iframe, language } });
		i18next.changeLanguage(language);
	},

	showWidget() {
		const { iframe } = store.state;
		store.setState({ iframe: { ...iframe, visible: true } });
		parentCall('showWidget');
	},

	hideWidget() {
		const { iframe } = store.state;
		store.setState({ iframe: { ...iframe, visible: false } });
		parentCall('hideWidget');
	},

	minimizeWidget() {
		store.setState({ minimized: true });
		parentCall('closeWidget');
	},

	maximizeWidget() {
		store.setState({ minimized: false });
		parentCall('openWidget');
	},
	setParentUrl(parentUrl) {
		store.setState({ parentUrl });
	},
};

const onNewMessage = (event) => {
	if (event.source === event.target) {
		return;
	}

	if (typeof event.data === 'object' && event.data.src !== undefined && event.data.src === 'rocketchat') {
		if (api[event.data.fn] !== undefined && typeof api[event.data.fn] === 'function') {
			const args = [].concat(event.data.args || []);
			api[event.data.fn].apply(null, args);
		}
	}
};

class Hooks {
	constructor() {
		if (!Hooks.instance) {
			this._started = false;
			Hooks.instance = this;
		}

		return Hooks.instance;
	}

	init() {
		if (this._started) {
			return;
		}

		this._started = true;
		window.addEventListener('message', onNewMessage, false);
	}

	reset() {
		this._started = false;
		window.removeEventListener('message', onNewMessage, false);
	}
}

const instance = new Hooks();
export default instance;
