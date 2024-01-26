import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { memo, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { useRoom } from '../../contexts/RoomContext';
import type { URLMeta } from './MessageURLPreview';
import MessageURLPreview from './MessageURLPreview';

type MessageURLPreviewListProps = {
	urls: string[];
};

const MAX_URLS_TO_PREVIEW = 5;

function isInternalURL(url: string): boolean {
	const { hostname } = new URL(url);
	return hostname === window.location.hostname;
}

const MessageURLPreviewList = ({ urls }: MessageURLPreviewListProps): ReactElement => {
	const room = useRoom();
	const getURLMetadataEndpoint = useEndpoint('GET', '/v1/chat.getURLPreview');
	const [urlsMetadata, setURLMetadatas] = useState<URLMeta[]>([]);

	useEffect(() => {
		// We should only fetch metadata for external URLs
		const promises = urls.filter((url) => !isInternalURL(url)).map((url) => getURLMetadataEndpoint({ url, roomId: room._id }));

		const fetchURLMetadata = async (): Promise<URLMeta[]> => {
			const result = await Promise.all(promises);
			return result
				.map(({ urlPreview }) => urlPreview.meta)
				.filter((meta) => Object.keys(meta).length > 0)
				.slice(0, MAX_URLS_TO_PREVIEW);
		};

		fetchURLMetadata().then((result) => setURLMetadatas(result));
	}, [getURLMetadataEndpoint, setURLMetadatas, urls, room._id]);

	// TODO: Align all previews to the left and add a margin between them
	return (
		<>
			{urlsMetadata.map((meta, i) => (
				<MessageURLPreview key={i} meta={meta} />
			))}
		</>
	);
};

export default memo(MessageURLPreviewList);
