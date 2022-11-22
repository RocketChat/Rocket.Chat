import { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MessageContentBody from '../../../../views/room/MessageList/components/MessageContentBody';
import MarkdownText from '../../../MarkdownText';
import Attachment from '../Attachment';
import AttachmentContent from '../Attachment/AttachmentContent';
import AttachmentDescription from '../Attachment/AttachmentDescription';
import AttachmentDownload from '../Attachment/AttachmentDownload';
import AttachmentRow from '../Attachment/AttachmentRow';
import AttachmentSize from '../Attachment/AttachmentSize';
import AttachmentTitle from '../Attachment/AttachmentTitle';
import { useCollapse } from '../hooks/useCollapse';

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
				<MarkdownText parseEmoji variant='inline' content={description} />
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
