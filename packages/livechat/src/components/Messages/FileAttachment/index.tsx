import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import DownloadIcon from '../../../icons/download.svg';
import { FileAttachmentIcon } from '../FileAttachmentIcon';
import { MessageBubble } from '../MessageBubble';
import styles from './styles.scss';

type FileAttachmentProps = {
	url: string;
	title: string;
	className?: string;
};

export const FileAttachment = memo(({ url, title, className, ...messageBubbleProps }: FileAttachmentProps) => (
	<MessageBubble className={createClassName(styles, 'file-attachment', {}, [className])} {...messageBubbleProps}>
		<a href={url} download target='_blank' rel='noopener noreferrer' className={createClassName(styles, 'file-attachment__inner')}>
			<FileAttachmentIcon url={url} />
			<span className={createClassName(styles, 'file-attachment__title')}>{title}</span>
			<DownloadIcon width={20} height={20} className={createClassName(styles, 'file-attachment__download-button')} />
		</a>
	</MessageBubble>
));
