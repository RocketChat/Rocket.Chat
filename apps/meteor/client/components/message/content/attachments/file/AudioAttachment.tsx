import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayer } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React from 'react';

import MessageCollapsible from '../../../MessageCollapsible';
import AttachmentDescription from '../structure/AttachmentDescription';

const AudioAttachment = ({
	title,
	audio_url: url,
	audio_type: type,
	audio_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
	isMessageEncrypted,
}: AudioAttachmentProps & { isMessageEncrypted: boolean }) => {
	const getURL = useMediaUrl();
	return (
		<>
			<AttachmentDescription description={description} descriptionMd={descriptionMd} isMessageEncrypted={isMessageEncrypted} />
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AudioPlayer src={getURL(url)} type={type} />
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
