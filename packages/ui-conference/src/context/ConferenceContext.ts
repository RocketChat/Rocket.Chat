import { createContext, useContext } from 'react';

import type {
	ConferenceActions,
	ConferenceCall,
	ConferenceRoom,
	ConferenceSession,
	ConferenceSlots,
	ConferenceViewer,
} from './definitions';

/**
 * One call, as the window that shows it needs to know it.
 *
 * Everything here is either a fact about the call or something to do to it, and none of it is fetched by the
 * views that read it — which is what lets the whole window be drawn from a fixture. The application answers it
 * from wherever the truth actually lives; this package only ever asks.
 */
export type ConferenceContextValue = {
	callId: string;
	call: ConferenceCall;
	room: ConferenceRoom;
	session: ConferenceSession;
	actions: ConferenceActions;
	slots: ConferenceSlots;
	/** What the workspace and this reader's preferences have settled, read once rather than per component. */
	viewer: ConferenceViewer;
	/**
	 * Which thread is open over the chat, rather than the thread itself — it is shown inside the room's own
	 * provider, which is the application's. Kept here because navigation can open one too, and that arrives from
	 * outside this window.
	 */
	thread: {
		tmid?: string;
		open: (tmid: string) => void;
		close: () => void;
	};
};

/**
 * Everything says "not yet": a window with no call, no room and no session, and actions that do nothing.
 *
 * A default that threw would make every story and every test supply the whole value to render a corner of it,
 * and a default that fetched would be the coupling this package exists to avoid.
 */
export const defaultConferenceContextValue: ConferenceContextValue = {
	callId: '',
	call: {
		members: [],
		canRing: false,
		ended: false,
		name: '',
		createdAt: undefined,
		canRename: false,
		capabilities: {},
		placing: false,
	},
	room: {
		loading: true,
		retry: () => undefined,
		unread: { count: 0, hasUnseenActivity: false },
	},
	session: {
		embedded: false,
		joined: false,
		loading: false,
		retry: () => undefined,
	},
	actions: {
		join: () => undefined,
		leave: () => undefined,
		ringMember: () => Promise.resolve(),
		shareChat: () => Promise.resolve(),
		addParticipants: () => Promise.resolve({ added: 0 }),
	},
	slots: {},
	viewer: {
		uid: null,
		useRealName: false,
		displayAvatars: true,
		canRingUsers: false,
	},
	thread: {
		open: () => undefined,
		close: () => undefined,
	},
};

export const ConferenceContext = createContext<ConferenceContextValue>(defaultConferenceContextValue);

export const useConference = (): ConferenceContextValue => useContext(ConferenceContext);

export const useConferenceCall = (): ConferenceCall => useContext(ConferenceContext).call;

export const useConferenceRoom = (): ConferenceRoom => useContext(ConferenceContext).room;

export const useConferenceSession = (): ConferenceSession => useContext(ConferenceContext).session;

export const useConferenceActions = (): ConferenceActions => useContext(ConferenceContext).actions;

export const useConferenceSlots = (): ConferenceSlots => useContext(ConferenceContext).slots;

export const useConferenceViewer = (): ConferenceViewer => useContext(ConferenceContext).viewer;
