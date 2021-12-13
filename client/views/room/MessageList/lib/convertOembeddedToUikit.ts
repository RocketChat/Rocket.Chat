import { PreviewBlock } from '@rocket.chat/ui-kit';

type OembedUrlLegacy = {
	url: string;
	meta: Record<string, string>;
};

type PreviewType =
	| 'external' // preview com jump to
	| 'embedded' // play and preview com jump to
	| 'video' // attachment
	| 'image' // attachment
	| 'audio'; // attachment

type PreviewMetadata = Partial<{
	siteName: string; // nome
	siteUrl: string; // parsedUrl.host
	siteColor: string; // ogColor
	title: string; // ogTitle
	description: string; // ogDescription
	authorName: string;
	authorUrl?: string;
	image: {
		preview?: string; // base64 low res preview
		src: string;
		dimensions: {
			width?: number;
			height?: number;
		};
	};
	url: string;
	type: PreviewType;
	html?: string; // for embedded OembedType
}>;

const normalizeType = (type: string): PreviewType => {
	switch (type) {
		case 'rich':
		case 'video':
			return 'embedded';

		case 'photo':
			return 'image';

		default:
			return 'external';
	}
};

export const normalizeMeta = ({ url, meta }: OembedUrlLegacy): PreviewMetadata => {
	const image =
		meta.ogImage ||
		meta.twitterImage ||
		meta.msapplicationTileImage ||
		meta.oembedThumbnailUrl ||
		meta.oembedThumbnailUrl;

	const imageHeight = meta.ogImageHeight || meta.oembedHeight || meta.oembedThumbnailHeight;
	const imageWidth = meta.ogImageWidth || meta.oembedWidth || meta.oembedThumbnailWidth;

	const type = normalizeType(meta.ogType || meta.oembedType);

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
			type,
			...(type === 'embedded' && { html: meta.oembedHtml }),
		}).filter(([, value]) => value),
	);
};

export const convertOembedToUiKit = (urls: OembedUrlLegacy[]): PreviewBlock[] =>
	urls
		.filter(({ meta }) => Boolean(meta))
		.map(normalizeMeta)
		.map(({ title, description, url, image, authorName, authorUrl, siteName, siteUrl }) => ({
			type: 'preview',
			title: title
				? [
						{
							type: 'plain_text',
							text: title,
						},
				  ]
				: [],
			description: description
				? [
						{
							type: 'plain_text',
							text: description,
						},
				  ]
				: [],
			...(url && { externalUrl: url }),
			...(image && {
				[image.dimensions.height && image.dimensions ? 'preview' : 'thumb']: image,
			}),
			footer: {
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `[${siteName}](${siteUrl})`,
					},
					...(authorName && authorUrl
						? [
								{
									type: 'plain_text',
									text: `|`,
								},
								{
									type: 'mrkdwn',
									text: `[${authorName}](${authorUrl})`,
								},
						  ]
						: []),
				].filter(Boolean) as Required<PreviewBlock>['footer']['elements'],
			},
		}));
