import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import MarkdownText from '../../../../MarkdownText';
import MessageContentBody from '../../../MessageContentBody';
import { useCollapse } from '../../../hooks/useCollapse';
import Attachment from '../structure/Attachment';
import AttachmentContent from '../structure/AttachmentContent';
import AttachmentDescription from '../structure/AttachmentDescription';
import AttachmentDownload from '../structure/AttachmentDownload';
import AttachmentRow from '../structure/AttachmentRow';
import AttachmentSize from '../structure/AttachmentSize';
import AttachmentTitle from '../structure/AttachmentTitle';

export const AudioAttachment: FC<AudioAttachmentProps> = ({
	title,
	audio_url: url,
	audio_type: type,
	collapsed: collapsedDefault = false,
	audio_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
	md,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();
	return (
		<Attachment>
			<AttachmentDescription>
				{md ? <MessageContentBody md={md} /> : <MarkdownText parseEmoji variant='inline' content={description} />}
			</AttachmentDescription>
			<AttachmentRow>
				<AttachmentTitle>{title}</AttachmentTitle>
				{size && <AttachmentSize size={size} />}
				{collapse}
				{hasDownload && link && <AttachmentDownload title={title} href={getURL(link)} />}
			</AttachmentRow>
			{!collapsed && (
				<AttachmentContent border='none'>
					<audio controls preload='metadata'>
						<source src={getURL(url)} type={type} />
					</audio>
				</AttachmentContent>
			)}
		</Attachment>
	);
};
