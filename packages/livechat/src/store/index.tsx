import type { ComponentChildren } from 'preact';
import { Component, createContext } from 'preact';

import type { CustomField } from '../components/Form/CustomFields';
import type { Department } from '../definitions/departments';
import { parentCall } from '../lib/parentCall';
import { createToken } from '../lib/random';
import Store from './Store';

export type LivechatStoreState = {
	token: string;
	typing: string[];
	config: {
		messages: any;
		theme: any;
		triggers: any[];
		resources: any;
		settings: {
			registrationForm?: boolean;
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
			forceAcceptDataProcessingConsent?: boolean;
			fileUpload?: any;
			allowSwitchingDepartments?: any;
			showConnecting?: any;
			limitTextLength?: any;
			displayOfflineForm?: boolean;
		};
		online?: boolean;
		departments: Department[];
		customFields?: CustomField[];
		enabled?: boolean;
	};
	messages: any[];
	user: any;
	sound: {
		src?: string;
		play?: boolean;
		enabled: boolean;
	};
	iframe: {
		guest: any;
		theme: any;
		visible: boolean;
	};
	gdpr: {
		accepted: boolean;
	};
	alerts: any[];
	visible: boolean;
	minimized: boolean;
	unread: any;
	incomingCallAlert: any;
	ongoingCall: any;
	businessUnit: any;
	openSessionIds?: string[];
	triggered?: boolean;
	undocked?: boolean;
	expanded?: boolean;
	modal?: any;
	agent?: any;
	room?: any;
	noMoreMessages?: boolean;
	loading?: boolean;
	department?: string;
	lastReadMessageId?: any;
	triggerAgent?: any;
	queueInfo?: any;
	defaultAgent?: any;
};

export const initialState = (): LivechatStoreState => ({
	token: createToken(),
	typing: [],
	config: {
		messages: {},
		settings: {},
		theme: {},
		triggers: [],
		departments: [],
		resources: {},
	},
	messages: [],
	user: null,
	sound: {
		src: '',
		enabled: true,
		play: false,
	},
	iframe: {
		guest: {},
		theme: {},
		visible: true,
	},
	gdpr: {
		accepted: false,
	},
	alerts: [],
	visible: true,
	minimized: true,
	unread: null,
	incomingCallAlert: null,
	ongoingCall: null, // TODO: store call info like url, startTime, timeout, etc here
	businessUnit: null,
});

const dontPersist = [
	'messages',
	'typing',
	'loading',
	'alerts',
	'unread',
	'noMoreMessages',
	'modal',
	'incomingCallAlert',
	'ongoingCall',
	'parentUrl',
];

export const store = new Store(initialState(), { dontPersist });

const { sessionStorage } = window;

window.addEventListener('load', () => {
	const sessionId = createToken();
	sessionStorage.setItem('sessionId', sessionId);
	const { openSessionIds = [] } = store.state;
	store.setState({ openSessionIds: [sessionId, ...openSessionIds] });
});

window.addEventListener('visibilitychange', () => {
	!store.state.minimized && !store.state.triggered && parentCall('openWidget');
	store.state.iframe.visible ? parentCall('showWidget') : parentCall('hideWidget');
});

window.addEventListener('beforeunload', () => {
	const sessionId = sessionStorage.getItem('sessionId');
	const { openSessionIds = [] } = store.state;
	store.setState({ openSessionIds: openSessionIds.filter((session) => session !== sessionId) });
});

if (process.env.NODE_ENV === 'development') {
	store.on('change', ([, , partialState]) => {
		console.log('%cstore.setState %c%o', 'color: blue', 'color: initial', partialState);
	});
}

export type Dispatch = (partialState: Partial<LivechatStoreState>) => void;

type StoreContextValue = LivechatStoreState & { dispatch: Dispatch };

export const StoreContext = createContext<StoreContextValue>({ ...store.state, dispatch: store.setState.bind(store) });

export class Provider extends Component {
	static displayName = 'StoreProvider';

	state = { ...store.state, dispatch: store.setState.bind(store) };

	handleStoreChange = () => {
		this.setState({ ...store.state });
	};

	componentDidMount() {
		store.on('change', this.handleStoreChange);
	}

	componentWillUnmount() {
		store.off('change', this.handleStoreChange);
	}

	render = ({ children }: { children: ComponentChildren }) => <StoreContext.Provider value={this.state}>{children}</StoreContext.Provider>;
}

export const { Consumer } = StoreContext;

export default store;
