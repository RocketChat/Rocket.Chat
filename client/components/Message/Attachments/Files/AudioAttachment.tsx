import React, { FC } from 'react';

import { useCollapse } from '../hooks/useCollapse';
import { Attachment, AttachmentPropsBase } from '../Attachment';
import { getURL } from '../../../../../app/utils/client';

export type AudioAttachmentProps = {
	audio_url: string;
	audio_type: string;
	audio_size?: number;
	title_link_download?: string;
} & AttachmentPropsBase;

export const AudioAttachment: FC<AudioAttachmentProps> = ({
	title,
	audio_url: url,
	audio_type: type,
	collapsed: collapsedDefault = false,
	audio_size: size,
	description,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	// useTranslation();
	return <Attachment>
		<Attachment.Row>
			<Attachment.Title>{title}</Attachment.Title>
			{size && <Attachment.Size size={size}/>}
			{collapse}
		</Attachment.Row>
		{ !collapsed && <Attachment.Content border='none'>
			<audio controls>
				<source src={getURL(url)} type={type}/>
			</audio>
			{description && <Attachment.Details is='figcaption'>{description}</Attachment.Details>}
		</Attachment.Content> }
	</Attachment>;
};
