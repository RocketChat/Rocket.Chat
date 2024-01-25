import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { memo, useMemo } from 'react';
import type { ReactElement } from 'react';

type MessageURLPreviewProps = {
	url: string;
	roomId: IRoom['_id'];
};

type URLMeta = {
	ogImage?: string;
	ogImageHeight?: string;
	ogImageWidth?: string;
	ogTitle?: string;
	ogType?: string;
	pageTitle?: string;
};

const MessageURLPreview = ({ url, roomId }: MessageURLPreviewProps): ReactElement => {
	const query = useMemo(
		() => ({
			roomId,
			url,
		}),
		[roomId, url],
	);
	const getURLMetadataEndpoint = useEndpoint('GET', '/v1/chat.getURLPreview');

	const { data, isLoading } = useQuery(['urlMetadata', query], async () => getURLMetadataEndpoint(query), {
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return <></>;
	}

	if (!data?.urlPreview.meta || Object.keys(data.urlPreview.meta).length === 0) {
		return <></>;
	}

	const { meta }: { meta: URLMeta } = data.urlPreview;

	// TODO: Use meta to render a preview of the URL
	console.log(meta);

	return <h1>hello world</h1>;
};

export default memo(MessageURLPreview);
