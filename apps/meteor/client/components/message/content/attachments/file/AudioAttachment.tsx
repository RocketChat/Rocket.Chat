import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

export const AudioAttachment: FC<AudioAttachmentProps> = ({
	title,
	audio_url: url,
	audio_type: type,
	audio_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
}) => {
	const getURL = useMediaUrl();
	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size}>
				<audio controls preload='metadata'>
					<source src={getURL(url)} type={type} />
				</audio>
			</MessageCollapsible>
		</>
	);
};
