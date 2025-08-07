import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ServerMediaSignal } from '@rocket.chat/media-signaling';
import { useEndpoint, useStream, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

// import { useIceServers } from './useIceServers';
import MediaCallsClient, { type MediaCallsClientConfig } from '../lib/MediaCallsClient';

type MediaCallsClientParams = {
	enabled?: boolean;
};

type MediaCallsClientResult = {
	mediaCallsClient: MediaCallsClient | null;
	error: Error | null;
};

export const useMediaCallsClient = ({ enabled = true }: MediaCallsClientParams = {}): MediaCallsClientResult => {
	const { _id: userId } = useUser() || {};
	const mediaCallsClientRef = useRef<MediaCallsClient | null>(null);

	const mediaCallsSignal = useEndpoint('POST', '/v1/media-calls.signal');
	const notifyUserStream = useStream('notify-user');

	const sendSignalFn: MediaCallsClientConfig['sendSignalFn'] = async (signal) => {
		await mediaCallsSignal({ signal });
	};

	// const iceServers = useIceServers();

	const { data: mediaCallsClient, error } = useQuery<MediaCallsClient | null, Error>({
		queryKey: ['media-calls-client', enabled, userId],
		queryFn: async () => {
			if (mediaCallsClientRef.current) {
				mediaCallsClientRef.current.clear();
			}

			if (!userId) {
				throw Error('error-user-not-found');
			}

			const config: MediaCallsClientConfig = {
				userId,
				sendSignalFn,
			};

			const mediaCallsClient = await MediaCallsClient.create(config);

			return mediaCallsClient;
		},
		initialData: null,
		enabled,
	});

	const notifyNewMediaSignal = useEffectEvent((signal: ServerMediaSignal) => {
		console.log('new media signal', signal);
		mediaCallsClient?.processSignal(signal);
	});

	useEffect(() => {
		const unsubNotification = notifyUserStream(`${userId}/media-signal`, notifyNewMediaSignal);

		return () => {
			unsubNotification();
		};
	}, [notifyNewMediaSignal, notifyUserStream, userId, mediaCallsClient]);

	useEffect(() => {
		mediaCallsClientRef.current = mediaCallsClient;

		return () => mediaCallsClientRef.current?.clear();
	}, [mediaCallsClient]);

	return { mediaCallsClient, error };
};
