import type { ILivechatTrigger, ILivechatVisitor, ILivechatVisitorDTO, IMessage, Serialized } from '@rocket.chat/core-typings';
import type { ComponentChildren } from 'preact';
import { Component, createContext } from 'preact';
import { useContext } from 'preact/hooks';

import Store from './Store';
import type { Alert, FileUploadConfig, IncomingCallAlert, LivechatConfigMessages, LivechatResource, QueueInfo } from './types';
import type { CustomField } from '../components/Form/CustomFields';
import type { Agent } from '../definitions/agents';
import type { Department } from '../definitions/departments';
import type { TriggerMessage } from '../definitions/triggerMessage';
import { parentCall } from '../lib/parentCall';
import { createToken } from '../lib/random';

export type LivechatHiddenSystemMessageType =
	| 'uj' // User joined
	| 'ul' // User left
	| 'livechat-close' // Chat closed
	| 'livechat-started' // Chat started
	| 'livechat_transfer_history'; // Chat transfered

export type StoreState = {
	token: string;
	typing: string[];
	config: {
		messages: LivechatConfigMessages;
		theme: {
			title?: string;
			color?: string;
			offlineTitle?: string;
			offlineColor?: string;
			position: 'left' | 'right';
			background?: string;
			hideExpandChat?: boolean;
			actionLinks?: {
				jitsi: {
					icon: string;
					i18nLabel: string;
				}[];
			};
		};
		triggers: ILivechatTrigger[];
		resources: LivechatResource;
		settings: {
			registrationForm?: boolean;
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
			forceAcceptDataProcessingConsent?: boolean;
			fileUpload?: FileUploadConfig;
			allowSwitchingDepartments?: boolean;
			showConnecting?: boolean;
			limitTextLength?: number | boolean;
			displayOfflineForm?: boolean;
			hiddenSystemMessages?: LivechatHiddenSystemMessageType[];
			hideWatermark?: boolean;
			livechatLogo?: { url: string };
			transcript?: boolean;
			visitorsCanCloseChat?: boolean;
		};
		online?: boolean;
		departments: Department[];
		customFields?: CustomField[];
		enabled?: boolean;
	};
	messages: (Serialized<IMessage> & { token?: string })[];
	user?: Serialized<ILivechatVisitor>;
	guest?: Serialized<ILivechatVisitorDTO>;
	sound: {
		src?: string;
		play?: boolean;
		enabled: boolean;
	};
	iframe: {
		guest: Partial<Serialized<ILivechatVisitorDTO>>;
		guestMetadata?: Record<string, string>;
		theme: {
			title?: string;
			color?: string;
			fontColor?: string;
			iconColor?: string;
			offlineTitle?: string;
			position?: 'left' | 'right';
			guestBubbleBackgroundColor?: string;
			agentBubbleBackgroundColor?: string;
			background?: string;
			hideGuestAvatar?: boolean;
			hideAgentAvatar?: boolean;
			hideExpandChat?: boolean;
		};
		visible?: boolean;
		department?: string;
		language?: string;
		defaultDepartment?: string;
		hiddenSystemMessages?: LivechatHiddenSystemMessageType[];
	};
	gdpr: {
		accepted: boolean;
	};
	alerts: Alert[];
	visible: boolean;
	minimized: boolean;
	unread: number | null;
	incomingCallAlert: IncomingCallAlert | null;
	businessUnit: string | null;
	openSessionIds?: string[];
	triggered?: boolean;
	undocked?: boolean;
	expanded?: boolean;
	modal: boolean;
	agent?: Agent;
	room?: { _id: string };
	noMoreMessages?: boolean;
	loading?: boolean;
	lastReadMessageId?: string | number;
	triggerAgent?: Agent;
	queueInfo?: QueueInfo;
	defaultAgent?: Agent;
	parentUrl?: string;
	connecting?: boolean;
	messageListPosition?: 'top' | 'bottom' | 'free';
	renderedTriggers: TriggerMessage[];
	customFieldsQueue: Record<string, { value: string; overwrite: boolean }>;
};

export const initialState = (): StoreState => ({
	token: createToken(),
	typing: [],
	config: {
		messages: {},
		settings: {},
		theme: {
			position: 'right',
		},
		triggers: [],
		departments: [],
		resources: {},
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
		theme: {
			hideGuestAvatar: true,
			hideAgentAvatar: false,
		},
		visible: true,
	},
	gdpr: {
		accepted: false,
	},
	alerts: [],
	visible: true,
	minimized: true,
	modal: false,
	unread: null,
	incomingCallAlert: null,
	businessUnit: null,
	renderedTriggers: [],
	customFieldsQueue: {},
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
	'parentUrl',
] as Array<keyof StoreState>;

export const store = new Store(initialState(), { dontPersist });

const { sessionStorage } = window;

window.addEventListener('load', () => {
	const sessionId = createToken();
	sessionStorage.setItem('sessionId', sessionId);
	const { openSessionIds = [] } = store.state;
	store.setState({ openSessionIds: [sessionId, ...openSessionIds] });
});

window.addEventListener('visibilitychange', () => {
	if (store.state.undocked) {
		return;
	}

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

export type Dispatch = typeof store.setState;

type StoreContextValue = StoreState & {
	dispatch: Dispatch;
	on: typeof store.on;
	off: typeof store.off;
};

export const StoreContext = createContext<StoreContextValue>({
	...store.state,
	dispatch: store.setState.bind(store),
	on: store.on.bind(store),
	off: store.off.bind(store),
});

export class Provider extends Component {
	static override displayName = 'StoreProvider';

	override state = {
		...store.state,
		dispatch: store.setState.bind(store),
		on: store.on.bind(store),
		off: store.off.bind(store),
	};

	handleStoreChange = () => {
		this.setState({ ...store.state });
	};

	override componentDidMount() {
		store.on('change', this.handleStoreChange);
	}

	override componentWillUnmount() {
		store.off('change', this.handleStoreChange);
	}

	render = ({ children }: { children: ComponentChildren }) => {
		return <StoreContext.Provider value={this.state}>{children}</StoreContext.Provider>;
	};
}

export const { Consumer } = StoreContext;

export default store;

export const useStore = (): StoreContextValue => {
	const store = useContext(StoreContext);

	return store;
};
