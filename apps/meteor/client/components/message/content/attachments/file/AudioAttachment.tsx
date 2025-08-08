import { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import CustomAudioPlayer from './AudioPlayerWithSpeed'; // 

const AudioAttachment = ({
  title,
  audio_url: url,
  audio_type: type,
  description,
  title_link: link,
  title_link_download: hasDownload,
  audio_size: size,
  collapsed,
  descriptionMd,
}: AudioAttachmentProps) => {
  const getURL = useMediaUrl();
  const audioSrc = getURL(url);

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" p="x8">
	<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>

      {descriptionMd ? (
        <MessageContentBody md={descriptionMd} />
      ) : (
        <MarkdownText parseEmoji content={description} />
      )}

        <CustomAudioPlayer src={audioSrc} type={type} />
      </MessageCollapsible>

    </Box>
  );
};

export default AudioAttachment;