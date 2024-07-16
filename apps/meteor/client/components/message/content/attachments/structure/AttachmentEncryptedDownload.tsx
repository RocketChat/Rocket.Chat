import type { ComponentProps } from 'react';
import React from 'react';

import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import AttachmentDownloadBase from './AttachmentDownloadBase';

type AttachmentDownloadProps = ComponentProps<typeof AttachmentDownloadBase>;

const AttachmentEncryptedDownload = ({ title, href, ...props }: AttachmentDownloadProps) => {
	const encryptedAnchorProps = useDownloadFromServiceWorker(href, title);

	return <AttachmentDownloadBase {...props} {...encryptedAnchorProps} title={title} href={href} />;
};

export default AttachmentEncryptedDownload;
