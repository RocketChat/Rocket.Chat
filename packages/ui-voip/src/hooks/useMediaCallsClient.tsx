import { useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

// import { useIceServers } from './useIceServers';
import MediaCallsClient from '../lib/MediaCallsClient';

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

			const mediaCallsClient = await MediaCallsClient.create(userId);

			return mediaCallsClient;
		},
		initialData: null,
		enabled,
	});

	useEffect(() => {
		mediaCallsClientRef.current = mediaCallsClient;

		return () => mediaCallsClientRef.current?.clear();
	}, [mediaCallsClient]);

	return { mediaCallsClient, error };
};
