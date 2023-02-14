import { withTranslation } from 'react-i18next';

import { createClassName, memo } from '../../helpers';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

const AudioAttachment = memo(({ url, className, t, ...messageBubbleProps }) => (
	<MessageBubble nude className={createClassName(styles, 'audio-attachment', {}, [className])} {...messageBubbleProps}>
		<audio src={url} controls className={createClassName(styles, 'audio-attachment__inner')}>
			{t('you_browser_doesn_t_support_audio_element')}
		</audio>
	</MessageBubble>
));

export default withTranslation()(AudioAttachment);
