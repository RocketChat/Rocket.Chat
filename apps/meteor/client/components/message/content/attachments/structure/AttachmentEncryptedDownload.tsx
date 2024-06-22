import type { ComponentProps, FC } from 'react';
import React from 'react';

import { useDownloadFromServiceWorker } from '../../../../../hooks/useDownloadFromServiceWorker';
import AttachmentDownloadBase from './AttachmentDownloadBase';

type AttachmentDownloadProps = ComponentProps<typeof AttachmentDownloadBase>;

const AttachmentEncryptedDownload: FC<AttachmentDownloadProps> = ({ title, href, ...props }) => {
	const encryptedAnchorProps = useDownloadFromServiceWorker(href, title);

	return <AttachmentDownloadBase {...props} {...encryptedAnchorProps} title={title} href={href} />;
};

export default AttachmentEncryptedDownload;
