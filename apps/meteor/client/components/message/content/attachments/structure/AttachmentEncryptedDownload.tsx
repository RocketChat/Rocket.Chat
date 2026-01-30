import type { ComponentProps } from 'react';

import AttachmentDownloadBase from './AttachmentDownloadBase';
import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';

type AttachmentDownloadProps = ComponentProps<typeof AttachmentDownloadBase>;

const AttachmentEncryptedDownload = ({ title, href, ...props }: AttachmentDownloadProps) => {
	const encryptedAnchorProps = useDownloadFromServiceWorker(href, title);

	return <AttachmentDownloadBase {...props} {...encryptedAnchorProps} title={title} href={href} />;
};

export default AttachmentEncryptedDownload;
