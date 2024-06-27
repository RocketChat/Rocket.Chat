import type { ComponentProps, FC } from 'react';
import React from 'react';

import type Action from '../../Action';
import AttachmentDownloadBase from './AttachmentDownloadBase';
import AttachmentEncryptedDownload from './AttachmentEncryptedDownload';

type AttachmentDownloadProps = Omit<ComponentProps<typeof Action>, 'icon'> & { title?: string | undefined; href: string };

const AttachmentDownload: FC<AttachmentDownloadProps> = ({ title, href, ...props }) => {
	const isEncrypted = href.includes('/file-decrypt/');

	if (isEncrypted) {
		return <AttachmentEncryptedDownload title={title} href={href} {...props} />;
	}

	return <AttachmentDownloadBase title={title} href={href} {...props} />;
};

export default AttachmentDownload;
