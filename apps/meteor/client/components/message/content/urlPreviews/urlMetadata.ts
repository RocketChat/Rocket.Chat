import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';
import { buildImageURL } from './buildImageURL';

export function normalizeMetadata({ url, meta }: { url: string; meta: Record<string, string> }): OEmbedPreviewMetadata {
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
					url: buildImageURL(url, image),
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
}
