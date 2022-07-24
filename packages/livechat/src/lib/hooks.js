import i18next from 'i18next';

import { Livechat } from '../api';
import { store } from '../store';
import CustomFields from './customFields';
import { loadConfig, updateBusinessUnit } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { loadMessages } from './room';
import Triggers from './triggers';

const createOrUpdateGuest = async (guest) => {
	const { token } = guest;
	token && await store.setState({ token });
	const user = await Livechat.grantVisitor({ visitor: { ...guest } });
	store.setState({ user });
};

const updateIframeGuestData = (data) => {
	const { iframe, iframe: { guest }, user: _id, token } = store.state;
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

		const { token, room: { _id: rid } = {} } = store.state;
		const { change, title, location: { href } } = info;

		Livechat.sendVisitorNavigation({ token, rid, pageInfo: { change, title, location: { href } } });
	},

	setCustomField(key, value, overwrite = true) {
		CustomFields.setCustomField(key, value, overwrite);
	},

	setTheme({ color, fontColor, iconColor, title, offlineTitle } = {}) {
		const { iframe, iframe: { theme } } = store.state;
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

	async setDepartment(value) {
		const { config: { departments = [] }, user: { department: existingDepartment } = {} } = store.state;

		const department = departments.find((dep) => dep._id === value || dep.name === value)?._id || '';

		updateIframeGuestData({ department });

		if (department !== existingDepartment) {
			await loadConfig();
			await loadMessages();
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
		const { token: localToken, iframe, iframe: { guest } } = store.state;
		if (token === localToken) {
			return;
		}
		store.setState({ token, iframe: { ...iframe, guest: { ...guest, token } } });
		await loadConfig();
	},

	setGuestName(name) {
		updateIframeGuestData({ name });
	},

	setGuestEmail(email) {
		updateIframeGuestData({ email });
	},

	registerGuest(data = {}) {
		if (typeof data !== 'object') {
			return;
		}

		if (!data.token) {
			data.token = createToken();
		}

		if (data.department) {
			api.setDepartment(data.department);
		}

		createOrUpdateGuest(data);
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
