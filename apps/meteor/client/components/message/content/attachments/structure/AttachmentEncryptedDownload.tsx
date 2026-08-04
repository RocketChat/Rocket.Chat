import type { ComponentProps } from 'react';

import AttachmentDownloadBase from './AttachmentDownloadBase';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';

export type AttachmentEncryptedDownloadProps = ComponentProps<typeof AttachmentDownloadBase>;

const AttachmentEncryptedDownload = ({ title, href, ...props }: AttachmentEncryptedDownloadProps) => {
	const encryptedAnchorProps = useDownloadFromServiceWorker(href, title);

	return <AttachmentDownloadBase {...props} {...encryptedAnchorProps} title={title} href={href} />;
};

export default AttachmentEncryptedDownload;
