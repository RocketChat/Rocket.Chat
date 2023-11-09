import i18next from 'i18next';

import { Livechat } from '../api';
import type { StoreState } from '../store';
import { initialState, store } from '../store';
import CustomFields from './customFields';
import { loadConfig, updateBusinessUnit } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { loadMessages } from './room';
import Triggers from './triggers';

const createOrUpdateGuest = async (guest: StoreState['guest']) => {
	if (!guest) {
		return;
	}
	const { token } = guest;
	token && (await store.setState({ token }));
	const { visitor: user } = await Livechat.grantVisitor({ visitor: { ...guest } });
	store.setState({ user });
};

const updateIframeGuestData = (data: Partial<StoreState['guest']>) => {
	const {
		iframe,
		iframe: { guest },
		user,
		token,
	} = store.state;

	const iframeGuest = { ...guest, ...data } as StoreState['guest'];

	store.setState({ iframe: { ...iframe, guest: iframeGuest } });

	if (!user) {
		return;
	}

	const guestData = { token, ...data };
	createOrUpdateGuest(guestData);
};

export type Api = typeof api;

export type ApiMethods = keyof Api;

export type ApiArgs<Method> = Method extends ApiMethods ? Parameters<Api[Method]>[0] : never;

export type ApiMethodsAndArgs = {
	[Method in ApiMethods]: ApiArgs<Method>;
};

const api = {
	pageVisited({ info }: { info: { change: string; title: string; location: { href: string } } }) {
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

	setCustomField({ key, value, overwrite = true }: { key: string; value?: string; overwrite: boolean }) {
		CustomFields.setCustomField(key, value, overwrite);
	},

	setTheme({ theme: { color, fontColor, iconColor, title, offlineTitle } }: { theme: StoreState['iframe']['theme'] }) {
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

	async setDepartment({ value }: { value: string }) {
		const {
			user,
			config: { departments = [] },
			defaultAgent,
		} = store.state;

		const { department: existingDepartment } = user || {};

		const department = departments.find((dep) => dep._id === value || dep.name === value)?._id || '';

		updateIframeGuestData({ department });

		if (defaultAgent && defaultAgent.department !== department) {
			store.setState({ defaultAgent: undefined });
		}

		if (department !== existingDepartment) {
			await loadConfig();
			await loadMessages();
		}
	},

	async setBusinessUnit({ newBusinessUnit }: { newBusinessUnit: string }) {
		if (!newBusinessUnit?.trim().length) {
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

	async clearWidgetData() {
		const { minimized, visible, undocked, expanded, businessUnit, ...initial } = initialState();
		await store.setState(initial);
	},

	setAgent({ agent: { _id, username, ...props } }: { agent: StoreState['defaultAgent'] }) {
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

	setExpanded({ expanded }: { expanded: StoreState['expanded'] }) {
		store.setState({ expanded });
	},

	async setGuestToken(token: string) {
		const { token: localToken } = store.state;
		if (token === localToken) {
			return;
		}
		createOrUpdateGuest({ token });
		await loadConfig();
	},

	setGuestName({ name }: { name: string }) {
		updateIframeGuestData({ name });
	},

	setGuestEmail({ email }: { email: string }) {
		updateIframeGuestData({ email });
	},

	registerGuest({ data }: { data: StoreState['guest'] }) {
		if (typeof data !== 'object') {
			return;
		}

		if (!data.token) {
			data.token = createToken();
		}

		if (data.department) {
			api.setDepartment({ value: data.department });
		}

		createOrUpdateGuest(data);
	},

	async setLanguage({ language }: { language: StoreState['iframe']['language'] }) {
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

	setParentUrl({ parentUrl }: { parentUrl: StoreState['parentUrl'] }) {
		store.setState({ parentUrl });
	},
};

function onNewMessage<T extends ApiMethods>(event: MessageEvent<{ src?: string; fn: T; args: ApiArgs<T> }>) {
	if (event.source === event.target) {
		return;
	}

	if (!event.data || typeof event.data !== 'object') {
		return;
	}

	if (!event.data.src || event.data.src !== 'rocketchat') {
		return;
	}

	const { fn } = event.data;

	const { args } = event.data;

	// TODO: Refactor widget.js to ts and change their calls to use objects instead of ordered arguments
	api[fn](args);
}

class Hooks {
	private _started: boolean;

	constructor() {
		if (instance) {
			throw new Error('Hooks already has an instance.');
		}

		this._started = false;
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
