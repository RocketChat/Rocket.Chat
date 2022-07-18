import { IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { AvatarUrlContext, useSetting, useStream } from '@rocket.chat/ui-contexts';
import React, { useMemo, FC, useEffect } from 'react';

import { Users } from '../../app/models/client';
import { getURL } from '../../app/utils/lib/getURL';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

const createUserAvatarSubscription = ({
	cdnURL,
	externalProviderURL,
	subscribeToNotifyLoggedEvent,
}: {
	cdnURL?: string;
	externalProviderURL: string;
	subscribeToNotifyLoggedEvent: <T>(eventName: string, callback: (data: T) => void) => () => void;
}): {
	observeAll: () => () => void;
	getSnapshot: (username: string) => string;
	subscribe: (username: string, callback: () => void) => () => void;
} => {
	// It's OK to use this function scope to store state because we're delegating garbage collection to the
	// `useMemo` hook itself.
	const urls = new Map<string, string>();
	const emitter = new Emitter<{ [username: string]: string }>();

	// We're going to use this to create a cache busting parameter when ETag is not available
	const cacheBustParameter = Math.ceil(Date.now() / 10_000);

	const composeURL = ((): ((username: string, etag?: string) => string) => {
		if (externalProviderURL) {
			return (username: string): string =>
				externalProviderURL
					.trim()
					.replace(/\/+$/, '')
					.replace('{username}', () => encodeURIComponent(username)); // Using a function to avoid placeholder replacement
		}

		if (cdnURL) {
			return (username: string, etag?: string): string =>
				`${cdnURL}/avatar/${encodeURIComponent(username)}${etag ? `?etag=${etag}` : `?_cachebust=${cacheBustParameter}`}`;
		}

		return (username: string, etag?: string): string =>
			getURL(`/avatar/${encodeURIComponent(username)}${etag ? `?etag=${etag}` : `?_cachebust=${cacheBustParameter}`}`);
	})();

	const observeAll = (): (() => void) => {
		const unsubscribe = subscribeToNotifyLoggedEvent<{ username: string; etag?: string }>('updateAvatar', ({ username, etag }) => {
			const url = composeURL(username, etag);
			urls.set(username, url);
			emitter.emit(username, url);
		});

		const computation = Users.find().observe({
			added: ({ username, avatarETag: etag }: Pick<IUser, 'username' | 'avatarETag'>) => {
				if (!username) {
					return;
				}

				const url = composeURL(username, etag);
				urls.set(username, url);
				emitter.emit(username, url);
			},
		});

		return (): void => {
			unsubscribe();
			computation.stop();
		};
	};

	const subscribe = (username: string, callback: () => void): (() => void) => emitter.on(username, callback);

	const getSnapshot = (username: string): string => {
		const cached = urls.get(username);

		if (cached) {
			return cached;
		}

		const url = composeURL(username);
		urls.set(username, url);
		return url;
	};

	return {
		observeAll,
		subscribe,
		getSnapshot,
	};
};

const AvatarUrlProvider: FC = ({ children }) => {
	const cdnAvatarUrl = String(useSetting('CDN_PREFIX') || '');
	const externalProviderUrl = String(useSetting('Accounts_AvatarExternalProviderUrl') || '');
	const subscribeToNotifyLoggedEvent = useStream('notify-logged');

	const {
		observeAll: observeUserAvatars,
		getSnapshot: getUserAvatarURL,
		subscribe: subscribeToUserAvatarURL,
	} = useMemo(
		() =>
			createUserAvatarSubscription({
				cdnURL: cdnAvatarUrl,
				externalProviderURL: externalProviderUrl,
				subscribeToNotifyLoggedEvent,
			}),
		[cdnAvatarUrl, externalProviderUrl, subscribeToNotifyLoggedEvent],
	);

	useEffect(() => observeUserAvatars(), [observeUserAvatars]);

	const contextValue = useMemo(
		() => ({
			getUserAvatarURL,
			subscribeToUserAvatarURL,
			getRoomPathAvatar: ({ type, ...room }: any): string =>
				roomCoordinator.getRoomDirectives(type || room.t)?.getAvatarPath({ username: room._id, ...room }) || '',
		}),
		[getUserAvatarURL, subscribeToUserAvatarURL],
	);

	return <AvatarUrlContext.Provider children={children} value={contextValue} />;
};

export default AvatarUrlProvider;
