import {
	MessageGenericPreviewContent,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
	MessageGenericPreviewFooter,
	Box,
} from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { useContext } from 'react';

import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';
import { MarkdownTextContext } from '../../../MarkdownTextContext';

export type OEmbedPreviewContentProps = { thumb?: ReactElement<any>; children?: ReactNode } & OEmbedPreviewMetadata;

const OEmbedPreviewContent = ({ title, description, url, thumb, authorName, authorUrl, siteName, siteUrl }: OEmbedPreviewContentProps) => {
	const MarkdownText = useContext(MarkdownTextContext);
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
						{showFooterSeparator && <Box marginInline={4}>|</Box>}
						{showAuthorName && <MarkdownText variant='inline' content={`[${authorName}](${authorUrl})`} />}
					</Box>
				</MessageGenericPreviewFooter>
			)}
		</MessageGenericPreviewContent>
	);
};

export default OEmbedPreviewContent;
