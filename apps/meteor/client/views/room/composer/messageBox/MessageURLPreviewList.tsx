import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useSubscription } from 'use-subscription';

import { useChat } from '../../contexts/ChatContext';
import { useRoom } from '../../contexts/RoomContext';
import type { MessageURLPreviewProps } from './MessageURLPreview';
import MessageURLPreview from './MessageURLPreview';

const MAX_URLS_TO_PREVIEW = 5;

function isInternalURL(url: string): boolean {
	const { hostname } = new URL(url);
	return hostname === window.location.hostname;
}

function useURLMetadatas(): MessageURLPreviewProps[] | undefined {
	const chat = useChat();
	const urlsSubscribable = chat?.composer?.urls;

	if (!urlsSubscribable) {
		throw new Error('Chat context not found');
	}

	const urls = useSubscription({
		getCurrentValue: urlsSubscribable.get,
		subscribe: urlsSubscribable.subscribe,
	});

	const room = useRoom();
	const getURLMetadataEndpoint = useEndpoint('GET', '/v1/chat.getURLPreview');
	const [urlsMetadata, setURLMetadatas] = useState<MessageURLPreviewProps[]>();

	useEffect(() => {
		// We should only fetch metadata for external URLs
		const promises = urls.filter((url) => !isInternalURL(url)).map((url) => getURLMetadataEndpoint({ url, roomId: room._id }));

		const fetchURLMetadata = async (): Promise<MessageURLPreviewProps[]> => {
			const result = await Promise.all(promises);
			return result
				.map(({ urlPreview }) => ({ meta: urlPreview.meta, url: urlPreview.url }))
				.filter(({ meta }) => Object.keys(meta).length > 0)
				.slice(0, MAX_URLS_TO_PREVIEW);
		};
		fetchURLMetadata().then((result) => setURLMetadatas(result));
	}, [getURLMetadataEndpoint, setURLMetadatas, urls, room._id]);

	return urlsMetadata;
}

const MessageURLPreviewList = (): ReactElement | null => {
	const urlsMetadata = useURLMetadatas();

	if (!urlsMetadata) {
		return null;
	}

	// TODO: Add a margin between them
	return (
		<Box display='flex' flexDirection='row'>
			{urlsMetadata.map(({ meta, url }, i) => (
				<MessageURLPreview key={i} meta={meta} url={url} />
			))}
		</Box>
	);
};

export default MessageURLPreviewList;
