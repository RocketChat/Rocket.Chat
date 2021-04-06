import React, { FC } from 'react';

import { useCollapse } from '../hooks/useCollapse';
import { useMediaUrl } from '../context/AttachmentContext';
import { FileProp } from '..';
import { Attachment, AttachmentPropsBase } from '../Attachment';
import MarkdownText from '../../../MarkdownText';


export type AudioAttachmentProps = {
	audio_url: string;
	audio_type: string;
	audio_size?: number;
	file?: FileProp;
} & AttachmentPropsBase;

export const AudioAttachment: FC<AudioAttachmentProps> = ({
	title,
	audio_url: url,
	audio_type: type,
	collapsed: collapsedDefault = false,
	audio_size: size,
	description,
	title_link: link,
	title_link_download: hasDownload,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();
	return <Attachment>
		<MarkdownText variant='inline' content={description} />
		<Attachment.Row>
			<Attachment.Title>{title}</Attachment.Title>
			{size && <Attachment.Size size={size}/>}
			{collapse}
			{hasDownload && link && <Attachment.Download title={title} href={getURL(link)}/>}
		</Attachment.Row>
		{ !collapsed && <Attachment.Content border='none'>
			<audio controls>
				<source src={getURL(url)} type={type}/>
			</audio>
		</Attachment.Content> }
	</Attachment>;
};
