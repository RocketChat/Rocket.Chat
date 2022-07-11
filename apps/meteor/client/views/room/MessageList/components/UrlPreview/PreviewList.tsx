import { MessageBlock } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useMessageOembedMaxWidth } from '../../../contexts/MessageContext';
import OEmbedResolver from './OEmbedResolver';
import UrlPreview from './UrlPreview';

type OembedUrlLegacy = {
	url: string;
	meta: Record<string, string>;
	headers?: { contentLength: string } | { contentType: string } | { contentLength: string; contentType: string };
};

type PreviewType = 'photo' | 'video' | 'link' | 'rich';

export type PreviewMetadata = Partial<{
	siteName: string; // nome
	siteUrl: string; // parsedUrl.host
	siteColor: string; // ogColor
	title: string; // ogTitle
	description: string; // ogDescription
	authorName: string;
	authorUrl?: string;
	image: {
		// preview?: string; // base64 low res preview
		url: string;
		dimensions: {
			width?: number;
			height?: number;
		};
	};
	url: string;
	type: PreviewType;
	html?: string; // for embedded OembedType
}>;

export type UrlPreview = {
	type: 'image' | 'video' | 'audio';
	originalType: string;
	url: string;
};

type PreviewListProps = { urls: OembedUrlLegacy[] | undefined };

type PreviewTypes = 'headers' | 'oembed';

type PreviewData = {
	type: PreviewTypes;
	data: PreviewMetadata | UrlPreview;
};

const normalizeMeta = ({ url, meta }: OembedUrlLegacy): PreviewMetadata => {
	const image = meta.ogImage || meta.twitterImage || meta.msapplicationTileImage || meta.oembedThumbnailUrl || meta.oembedThumbnailUrl;

	const imageHeight = meta.ogImageHeight || meta.oembedHeight || meta.oembedThumbnailHeight;
	const imageWidth = meta.ogImageWidth || meta.oembedWidth || meta.oembedThumbnailWidth;

	return Object.fromEntries(
		Object.entries({
			siteName: meta.ogSiteName || meta.oembedProviderName,
			siteUrl: meta.ogUrl || meta.oembedProviderUrl,
			title: meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle,
			description: meta.ogDescription || meta.twitterDescription || meta.description,
			authorName: meta.oembedAuthorName,
			authorUrl: meta.oembedAuthorUrl,
			...(image && {
				image: {
					url: image,
					dimensions: {
						...(imageHeight && { height: imageHeight }),
						...(imageWidth && { width: imageWidth }),
					},
				},
			}),
			url: meta.oembedUrl || url,
			type: meta.ogType || meta.oembedType,
			...(meta.oembedHtml && { html: meta.oembedHtml }),
		}).filter(([, value]) => value),
	);
};

const hasContentType = (headers: OembedUrlLegacy['headers']): headers is { contentType: string } =>
	headers ? 'contentType' in headers : false;

const getHeaderType = (headers: OembedUrlLegacy['headers']): UrlPreview['type'] | undefined => {
	if (!hasContentType(headers)) {
		return;
	}
	if (headers.contentType.match(/image\/.*/)) {
		return 'image';
	}
	if (headers.contentType.match(/audio\/.*/)) {
		return 'audio';
	}
	if (headers.contentType.match(/video\/.*/)) {
		return 'video';
	}
};

const isValidPreviewMeta = ({ siteName, siteUrl, authorName, authorUrl, title, description, image, html }: PreviewMetadata): boolean =>
	!((!siteName || !siteUrl) && (!authorName || !authorUrl) && !title && !description && !image && !html);

const processMetaAndHeaders = (url: OembedUrlLegacy): PreviewData | false => {
	if (!url.headers && !url.meta) {
		return false;
	}

	const data = url.meta && Object.values(url.meta) && normalizeMeta(url);
	if (data && isValidPreviewMeta(data)) {
		return { type: 'oembed', data };
	}

	const type = getHeaderType(url.headers);
	if (!type) {
		return false;
	}

	return {
		type: 'headers',
		data: { url: url.url, type, originalType: hasContentType(url.headers) ? url.headers?.contentType : '' },
	};
};

const isPreviewData = (data: PreviewData | false): data is PreviewData => !!data;

const isMetaPreview = (_data: PreviewData['data'], type: PreviewTypes): _data is PreviewMetadata => type === 'oembed';

const PreviewList = ({ urls }: PreviewListProps): ReactElement | null => {
	const oembedWidth = useMessageOembedMaxWidth();

	if (!urls) {
		throw new Error('urls is undefined - PreviewList');
	}

	const metaAndHeaders = urls.map(processMetaAndHeaders).filter(isPreviewData);

	return (
		<>
			{metaAndHeaders.map(({ type, data }, index) => {
				if (isMetaPreview(data, type)) {
					return (
						<MessageBlock width={oembedWidth} key={index}>
							<OEmbedResolver meta={data} />
						</MessageBlock>
					);
				}
				return (
					<MessageBlock width={oembedWidth} key={index}>
						<UrlPreview {...data} />
					</MessageBlock>
				);
			})}
		</>
	);
};

export default PreviewList;
