import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

type AudioAttachmentProps = {
	url: string;
	className?: string;
	t: (key: string) => string;
};

const AudioAttachment = ({ url, className, t, ...messageBubbleProps }: AudioAttachmentProps) => (
	<MessageBubble nude className={createClassName(styles, 'audio-attachment', {}, [className])} {...messageBubbleProps}>
		<audio src={url} controls className={createClassName(styles, 'audio-attachment__inner')}>
			{t('you_browser_doesn_t_support_audio_element')}
		</audio>
	</MessageBubble>
);

export default withTranslation()(memo(AudioAttachment));
