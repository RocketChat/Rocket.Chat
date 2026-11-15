import { memo } from 'preact/compat';
import { useTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import type { MessageBubbleProps } from '../MessageBubble';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

export type VideoAttachmentProps = {
	url: string;
	className?: string;
} & MessageBubbleProps;

const VideoAttachment = ({ url, className, ...messageBubbleProps }: VideoAttachmentProps) => {
	const { t } = useTranslation();
	return (
		<MessageBubble nude className={createClassName(styles, 'video-attachment', {}, [className])} {...messageBubbleProps}>
			{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
			<video src={url} controls className={createClassName(styles, 'video-attachment__inner')}>
				{t('you_browser_doesn_t_support_video_element')}
			</video>
		</MessageBubble>
	);
};

export default memo(VideoAttachment);
