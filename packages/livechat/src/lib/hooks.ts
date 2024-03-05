import i18next from 'i18next';

import { Livechat } from '../api';
import type { StoreState } from '../store';
import { initialState, store } from '../store';
import type { LivechatMessageEventData } from '../widget';
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

	if (!user) {
		return;
	}
	store.setState({ user } as Omit<StoreState['user'], 'ts'>);
	await loadConfig();
	Triggers.callbacks?.emit('chat-visitor-registered');
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

export type HooksWidgetAPI = typeof api;

const api = {
	pageVisited(info: { change: string; title: string; location: { href: string } }) {
		const { token, room } = store.state;
		const { _id: rid } = room || {};

		const {
			change,
			title,
			location: { href },
		} = info;

		Livechat.sendVisitorNavigation({ token, rid, pageInfo: { change, title, location: { href } } });
	},

	setCustomField: (key: string, value = '', overwrite = true) => {
		CustomFields.setCustomField(key, value, overwrite);
	},

	setTheme: (theme: StoreState['iframe']['theme']) => {
		const {
			iframe,
			iframe: { theme: currentTheme },
		} = store.state;
		store.setState({
			iframe: {
				...iframe,
				theme: {
					...currentTheme,
					...theme,
				},
			},
		});
	},

	setDepartment: async (value: string) => {
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

	setBusinessUnit: async (newBusinessUnit: string) => {
		if (!newBusinessUnit?.trim().length) {
			throw new Error('Error! Invalid business ids');
		}

		const { businessUnit: existingBusinessUnit } = store.state;

		return existingBusinessUnit !== newBusinessUnit && updateBusinessUnit(newBusinessUnit);
	},

	clearBusinessUnit: async () => {
		const { businessUnit } = store.state;
		return businessUnit && updateBusinessUnit();
	},

	clearDepartment: () => {
		updateIframeGuestData({ department: '' });
	},

	clearWidgetData: async () => {
		const { minimized, visible, undocked, expanded, businessUnit, ...initial } = initialState();
		await store.setState(initial);
	},

	setAgent: (agent: StoreState['defaultAgent']) => {
		if (!agent) {
			return;
		}

		const { _id, username, ...props } = agent;

		if (!_id || !username) {
			return console.warn('The fields _id and username are mandatory.');
		}

		store.setState({
			defaultAgent: {
				...props,
				_id,
				username,
				ts: Date.now(),
			},
		});
	},

	setExpanded: (expanded: StoreState['expanded']) => {
		store.setState({ expanded });
	},

	setGuestToken: async (token: string) => {
		const { token: localToken } = store.state;
		if (token === localToken) {
			return;
		}
		await createOrUpdateGuest({ token });
	},

	setGuestName: (name: string) => {
		updateIframeGuestData({ name });
	},

	setGuestEmail: (email: string) => {
		updateIframeGuestData({ email });
	},

	registerGuest: async (data: StoreState['guest']) => {
		if (typeof data !== 'object') {
			return;
		}

		if (!data.token) {
			data.token = createToken();
		}

		if (data.department) {
			api.setDepartment(data.department);
		}

		Livechat.unsubscribeAll();

		await createOrUpdateGuest(data);
	},

	setLanguage: async (language: StoreState['iframe']['language']) => {
		const { iframe } = store.state;
		await store.setState({ iframe: { ...iframe, language } });
		i18next.changeLanguage(language);
	},

	showWidget: () => {
		const { iframe } = store.state;
		store.setState({ iframe: { ...iframe, visible: true } });
		parentCall('showWidget');
	},

	hideWidget: () => {
		const { iframe } = store.state;
		store.setState({ iframe: { ...iframe, visible: false } });
		parentCall('hideWidget');
	},

	minimizeWidget: () => {
		store.setState({ minimized: true });
		parentCall('closeWidget');
	},

	maximizeWidget: () => {
		store.setState({ minimized: false });
		parentCall('openWidget');
	},

	setParentUrl: (parentUrl: StoreState['parentUrl']) => {
		store.setState({ parentUrl });
	},
	setGuestMetadata(metadata: StoreState['iframe']['guestMetadata']) {
		const { iframe } = store.state;
		store.setState({ iframe: { ...iframe, guestMetadata: metadata } });
	},
};

function onNewMessageHandler(event: MessageEvent<LivechatMessageEventData<HooksWidgetAPI>>) {
	if (event.source === event.target) {
		return;
	}

	if (!event.data || typeof event.data !== 'object') {
		return;
	}

	if (!event.data.src || event.data.src !== 'rocketchat') {
		return;
	}

	const { fn, args } = event.data;

	if (!api.hasOwnProperty(fn)) {
		return;
	}

	// There is an existing issue with overload resolution with type union arguments please see https://github.com/microsoft/TypeScript/issues/14107
	// @ts-expect-error: A spread argument must either have a tuple type or be passed to a rest parameter
	api[fn](...args);
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
		window.addEventListener('message', onNewMessageHandler, false);
	}

	reset() {
		this._started = false;
		window.removeEventListener('message', onNewMessageHandler, false);
	}
}

const instance = new Hooks();
export default instance;
