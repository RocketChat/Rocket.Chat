import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayer } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';

import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

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
}: AudioAttachmentProps) => {
	const originalGetURL = useMediaUrl();

	// If running inside Gitpod, modify getURL behavior
	const getURL = window.location.origin.includes('gitpod.io')
		? (path: string) => `${window.location.origin}${path}`
		: originalGetURL;

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AudioPlayer src={getURL(url)} type={type} />
			</MessageCollapsible>
		</>
	);
};

export default AudioAttachment;
