import {
	MessageGenericPreviewContent,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
	MessageGenericPreviewFooter,
	Box,
} from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import MarkdownText from '../../../../../components/MarkdownText';
import type { PreviewMetadata } from './PreviewList';

type OEmbedPreviewContentProps = { thumb?: ReactElement; children?: ReactNode } & PreviewMetadata;

const OEmbedPreviewContent = ({
	title,
	description,
	url,
	thumb,
	authorName,
	authorUrl,
	siteName,
	siteUrl,
}: OEmbedPreviewContentProps): ReactElement => {
	const showSiteName = siteName && siteUrl;
	const showAuthorName = authorName && authorUrl;
	const showFooterSeparator = showSiteName && showAuthorName;

	return (
		<MessageGenericPreviewContent thumb={thumb}>
			{title && (
				<MessageGenericPreviewTitle externalUrl={url} title={title}>
					{title}
				</MessageGenericPreviewTitle>
			)}
			{description && <MessageGenericPreviewDescription>{description}</MessageGenericPreviewDescription>}
			{(showSiteName || showAuthorName) && (
				<MessageGenericPreviewFooter>
					<Box display='flex' justifyContent='flex-start'>
						{showSiteName && <MarkdownText variant='inline' content={`[${siteName}](${siteUrl})`} />}
						{showFooterSeparator && <Box marginInline='x4'>{'|'}</Box>}
						{showAuthorName && <MarkdownText variant='inline' content={`[${authorName}](${authorUrl})`} />}
					</Box>
				</MessageGenericPreviewFooter>
			)}
		</MessageGenericPreviewContent>
	);
};

export default OEmbedPreviewContent;
