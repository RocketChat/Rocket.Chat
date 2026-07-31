import { memo } from 'preact/compat';
import { useTranslation } from 'react-i18next';

import { createClassName } from '../../../helpers/createClassName';
import type { MessageBubbleProps } from '../MessageBubble';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

export type AudioAttachmentProps = {
	url: string;
	className?: string;
} & MessageBubbleProps;

const AudioAttachment = ({ url, className, ...messageBubbleProps }: AudioAttachmentProps) => {
	const { t } = useTranslation();

	return (
		<MessageBubble nude className={createClassName(styles, 'audio-attachment', {}, [className])} {...messageBubbleProps}>
			{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
			<audio src={url} controls className={createClassName(styles, 'audio-attachment__inner')}>
				{t('you_browser_doesn_t_support_audio_element')}
			</audio>
		</MessageBubble>
	);
};

export default memo(AudioAttachment);
