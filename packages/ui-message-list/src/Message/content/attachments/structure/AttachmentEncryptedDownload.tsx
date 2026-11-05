import type { MouseEvent } from 'react';

import type { AttachmentDownloadBaseProps } from './AttachmentDownloadBase';
import AttachmentDownloadBase from './AttachmentDownloadBase';
import { useMessageMedia } from '../../../contexts/MessageMediaContext';

export type AttachmentEncryptedDownloadProps = AttachmentDownloadBaseProps;

const AttachmentEncryptedDownload = ({ title, href, ...props }: AttachmentEncryptedDownloadProps) => {
	const { downloadEncrypted, canDownloadEncrypted } = useMessageMedia();

	return (
		<AttachmentDownloadBase
			{...props}
			disabled={!canDownloadEncrypted}
			onContextMenu={(event: MouseEvent) => event.preventDefault()}
			onClick={(event: MouseEvent) => {
				event.preventDefault();
				downloadEncrypted(href, title);
			}}
			title={title}
			href={href}
		/>
	);
};

export default AttachmentEncryptedDownload;
