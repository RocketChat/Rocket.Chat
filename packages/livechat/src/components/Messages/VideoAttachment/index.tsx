import type { TFunction } from 'i18next';
import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

type VideoAttachmentProps = {
	url: string;
	className?: string;
	t: TFunction;
};
const VideoAttachment = ({ url, className, t, ...messageBubbleProps }: VideoAttachmentProps) => (
	<MessageBubble nude className={createClassName(styles, 'video-attachment', {}, [className])} {...messageBubbleProps}>
		<video src={url} controls className={createClassName(styles, 'video-attachment__inner')}>
			{t('you_browser_doesn_t_support_video_element')}
		</video>
	</MessageBubble>
);

export default withTranslation()(memo(VideoAttachment));
