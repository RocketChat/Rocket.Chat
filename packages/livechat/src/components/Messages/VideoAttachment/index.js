import { withTranslation } from 'react-i18next';

import { createClassName, memo } from '../../helpers';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

const VideoAttachment = memo(({ url, className, t, ...messageBubbleProps }) => (
	<MessageBubble nude className={createClassName(styles, 'video-attachment', {}, [className])} {...messageBubbleProps}>
		<video src={url} controls className={createClassName(styles, 'video-attachment__inner')}>
			{t('you_browser_doesn_t_support_video_element')}
		</video>
	</MessageBubble>
));

export default withTranslation()(VideoAttachment);
