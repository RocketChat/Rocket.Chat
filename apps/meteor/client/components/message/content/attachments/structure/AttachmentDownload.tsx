import type { ComponentPropsWithoutRef } from 'react';

import AttachmentDownloadBase from './AttachmentDownloadBase';
import AttachmentEncryptedDownload from './AttachmentEncryptedDownload';
import type Action from '../../Action';

type AttachmentDownloadProps = Omit<ComponentPropsWithoutRef<typeof Action>, 'icon'> & { title?: string | undefined; href: string };

const AttachmentDownload = ({ title, href, ...props }: AttachmentDownloadProps) => {
	const isEncrypted = href.includes('/file-decrypt/');

	if (isEncrypted) {
		return <AttachmentEncryptedDownload title={title} href={href} {...props} />;
	}

	return <AttachmentDownloadBase title={title} href={href} {...props} />;
};

export default AttachmentDownload;
