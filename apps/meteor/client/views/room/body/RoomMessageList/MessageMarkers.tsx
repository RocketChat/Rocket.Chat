import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from 'react';

const UNREAD = 1;
const MENTION = 2;
const ALL = 4;
const IGNORED = 8;

type MessageMarkersStore = {
	/** Makes `subscription` the one rows read now, so a row that renders in the same pass as the list reads it. */
	replace: (subscription: ISubscription | undefined) => void;
	/** Tells the rows what `replace` changed since the last time. */
	flush: () => void;
	get: () => ISubscription | undefined;
	subscribe: (onStoreChange: () => void) => () => void;
};

const createMessageMarkersStore = (initial: ISubscription | undefined): MessageMarkersStore => {
	let subscription = initial;
	let hasChanged = false;
	const listeners = new Set<() => void>();

	return {
		replace: (next) => {
			if (next === subscription) {
				return;
			}
			subscription = next;
			hasChanged = true;
		},
		flush: () => {
			if (!hasChanged) {
				return;
			}
			hasChanged = false;
			listeners.forEach((listener) => listener());
		},
		get: () => subscription,
		subscribe: (onStoreChange) => {
			listeners.add(onStoreChange);
			return () => listeners.delete(onStoreChange);
		},
	};
};

const noMarkers = createMessageMarkersStore(undefined);
const MessageMarkersContext = createContext<MessageMarkersStore>(noMarkers);

/**
 * Gives the rows of a list what the room's subscription says about their messages, held apart from the rows' props so that the
 * subscription changing renders only the rows whose own markers changed, and a change elsewhere in the client reaches none.
 */
export const MessageMarkers = ({ subscription, children }: { subscription: ISubscription | undefined; children: ReactNode }) => {
	const [store] = useState(() => createMessageMarkersStore(subscription));
	store.replace(subscription);
	useLayoutEffect(() => store.flush());

	return <MessageMarkersContext.Provider value={store}>{children}</MessageMarkersContext.Provider>;
};

/** Whether a message is unread, mentions the viewer or everyone, and whether its author is ignored, read as one number so a row renders again only when one of them changes. */
export const useMessageMarkers = ({ _id, u }: Pick<IMessage, '_id' | 'u'>) => {
	const store = useContext(MessageMarkersContext);
	const markers = useSyncExternalStore(store.subscribe, () => {
		const subscription = store.get();
		return (
			(subscription?.tunread?.includes(_id) ? UNREAD : 0) |
			(subscription?.tunreadUser?.includes(_id) ? MENTION : 0) |
			(subscription?.tunreadGroup?.includes(_id) ? ALL : 0) |
			(subscription?.ignored?.includes(u._id) ? IGNORED : 0)
		);
	});

	return { unread: !!(markers & UNREAD), mention: !!(markers & MENTION), all: !!(markers & ALL), ignoredUser: !!(markers & IGNORED) };
};
