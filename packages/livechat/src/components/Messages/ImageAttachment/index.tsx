import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

type ImageAttachmentProps = {
	url: string;
	className?: string;
};

export const ImageAttachment = memo(({ url, className, ...messageBubbleProps }: ImageAttachmentProps) => (
	<MessageBubble nude className={createClassName(styles, 'image-attachment', {}, [className])} {...messageBubbleProps}>
		<img className={createClassName(styles, 'image-attachment__inner')} src={url} alt={url} />
	</MessageBubble>
));
