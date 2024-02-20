import type { ILivechatTrigger, ILivechatVisitor, IMessage, Serialized } from '@rocket.chat/core-typings';
import type { ILivechatRoomAPI } from '@rocket.chat/sdk/interfaces';
import type { ComponentChildren } from 'preact';
import { Component, createContext } from 'preact';

import type { CustomField } from '../components/Form/CustomFields';
import type { Agent } from '../definitions/agents';
import type { Alert } from '../definitions/alert';
import type { Department } from '../definitions/departments';
import type { Guest } from '../definitions/guest';
import { parentCall } from '../lib/parentCall';
import { createToken } from '../lib/random';
import Store from './Store';

export type StoreStateKey = keyof StoreState;

// TODO: create proper `widget` types on core-typings (e.g. `IWidgetLivechatAgent`)
interface Messages {
	conversationFinishedMessage: string;
	conversationFinishedText: string;
	dataProcessingConsentText: string;
	offlineMessage: string;
	offlineSuccessMessage: string;
	offlineUnavailableMessage: string;
	registrationFormMessage: string;
	transcriptMessage: string;
	switchDepartmentMessage?: string;
}

interface ActionLinks {
	webrtc: {
		actionLinksAlignment: string;
		i18nLabel: string;
		label: string;
		method_id: string;
	}[];
	jitsi: {
		icon: string;
		i18nLabel: string;
	}[];
}

interface Theme {
	title?: string;
	color?: string;
	offlineTitle?: string;
	offlineColor?: string;
	actionLinks?: ActionLinks;
}

interface Settings {
	registrationForm?: boolean;
	nameFieldRegistrationForm?: boolean;
	emailFieldRegistrationForm?: boolean;
	forceAcceptDataProcessingConsent?: boolean;
	fileUpload?: boolean;
	allowSwitchingDepartments?: boolean;
	showConnecting?: boolean;
	limitTextLength?: number;
	displayOfflineForm?: boolean;
}

interface Config {
	messages: Messages;
	theme: Theme;
	triggers: ILivechatTrigger[];
	resources?: { src: string };
	settings: Settings;
	online?: boolean;
	departments: Department[];
	customFields?: CustomField[];
	enabled?: boolean;
}

interface Iframe {
	guest: Partial<Guest>;
	theme: {
		title?: string;
		color?: string;
		fontColor?: string;
		iconColor?: string;
		offlineTitle?: string;
	};
	visible?: boolean;
	department?: string;
	language?: string;
}
export interface StoreState {
	activeTriggers?: { [key: string]: { name: string; value: string } };
	agent?: Agent;
	config: Config;
	connecting?: boolean;
	defaultAgent?: { agent: Agent; success: boolean; ts: string } | string;
	department?: string;
	gdpr: { accepted: boolean };
	iframe: Iframe;
	typing: string[];
	messages: IMessage[];
	messageListPosition?: 'bottom' | 'top' | 'free';
	minimized: boolean;
	user?: Serialized<ILivechatVisitor>;
	sound: {
		src?: string;
		play?: boolean;
		enabled: boolean;
	};
	alerts: Alert[];
	visible: boolean;
	unread?: number;
	businessUnit?: string;
	openSessionIds?: string[];
	triggered?: boolean;
	modal?: Component;
	room?: ILivechatRoomAPI;
	noMoreMessages?: boolean;
	loading?: boolean;
	lastReadMessageId?: string;
	queueInfo?: { spot: number; estimatedWaitTimeSeconds: number; message?: string };
	token: string;
}

export const initialState = (): StoreState => ({
	token: createToken(),
	typing: [],
	config: {
		messages: {
			conversationFinishedMessage: '',
			conversationFinishedText: '',
			dataProcessingConsentText: '',
			offlineMessage: '',
			offlineSuccessMessage: '',
			offlineUnavailableMessage: '',
			registrationFormMessage: '',
			transcriptMessage: '',
		},
		settings: {},
		theme: {},
		triggers: [],
		departments: [],
		resources: undefined,
	},
	messages: [],
	user: undefined,
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
	unread: undefined,
	incomingCallAlert: undefined,
	ongoingCall: undefined, // TODO: store call info like url, startTime, timeout, etc here
	businessUnit: undefined,
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
] as StoreStateKey[];

export const store = new Store<StoreState>(initialState(), { dontPersist });

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

export type Dispatch = (partialState: Partial<StoreState>) => void;

type StoreContextValue = StoreState & { dispatch: Dispatch };

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
