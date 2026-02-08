import type {
	ILivechatVisitor,
	ILivechatVisitorDTO,
	Serialized,
} from '@rocket.chat/core-typings';
import type { ComponentChildren } from 'preact';
import { Component, createContext } from 'preact';
import { useContext } from 'preact/hooks';

import Store from './Store';
import type { CustomField } from '../components/Form/CustomFields';
import type { Agent } from '../definitions/agents';
import type { Department } from '../definitions/departments';
import type { TriggerMessage } from '../definitions/triggerMessage';
import { parentCall } from '../lib/parentCall';
import { createToken } from '../lib/random';

import type {
	LivechatAlert,
	LivechatQueueInfo,
	LivechatModalState,
} from './types';

/* ---------------- Hidden system messages ---------------- */

export type LivechatHiddenSytemMessageType =
	| 'uj'
	| 'ul'
	| 'livechat-close'
	| 'livechat-started'
	| 'livechat_transfer_history';

/* ---------------- Store State ---------------- */

export type StoreState = {
	token: string;
	typing: string[];

	config: {
		messages: Record<string, unknown>;
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
		triggers: unknown[];
		resources: Record<string, unknown>;
		settings: {
			registrationForm?: boolean;
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
			forceAcceptDataProcessingConsent?: boolean;
			fileUpload?: boolean;
			allowSwitchingDepartments?: boolean;
			showConnecting?: boolean;
			limitTextLength?: number;
			displayOfflineForm?: boolean;
			hiddenSystemMessages?: LivechatHiddenSytemMessageType[];
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

	messages: unknown[];

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
		hiddenSystemMessages?: LivechatHiddenSytemMessageType[];
	};

	gdpr: {
		accepted: boolean;
	};

	alerts: LivechatAlert[];

	visible: boolean;
	minimized: boolean;

	unread: number | null;
	incomingCallAlert: boolean | null;
	businessUnit: string | null;

	openSessionIds?: string[];
	triggered?: boolean;
	undocked?: boolean;
	expanded?: boolean;

	modal?: LivechatModalState;

	agent?: Agent;
	room?: { _id: string };

	noMoreMessages?: boolean;
	loading?: boolean;

	lastReadMessageId?: string;
	triggerAgent?: Agent;
	queueInfo?: LivechatQueueInfo;

	defaultAgent?: Agent;
	parentUrl?: string;
	connecting?: boolean;

	messageListPosition?: 'top' | 'bottom' | 'free';

	renderedTriggers: TriggerMessage[];
	customFieldsQueue: Record<string, { value: string; overwrite: boolean }>;
};

/* ---------------- Initial State ---------------- */

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
	unread: null,
	incomingCallAlert: null,
	businessUnit: null,
	renderedTriggers: [],
	customFieldsQueue: {},
});

/* ---------------- Store ---------------- */

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

/* ---------------- Context / Provider ---------------- */

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

	render = ({ children }: { children: ComponentChildren }) => (
		<StoreContext.Provider value={this.state}>{children}</StoreContext.Provider>
	);
}

export const { Consumer } = StoreContext;
export default store;

export const useStore = (): StoreContextValue => useContext(StoreContext);
