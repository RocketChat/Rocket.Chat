import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import Action from './AttachmentAction';

const AttachmentDownload: FC<Omit<ComponentProps<typeof Action>, 'icon'> & { title?: string | undefined; href: string }> = ({
	title,
	href,
	...props
}) => {
	const t = useTranslation();
	return (
		<Action
			icon='download'
			href={`${href}?download`}
			title={t('Download')}
			is='a'
			target='_blank'
			rel='noopener noreferrer'
			download={title}
			{...props}
		/>
	);
};

export default AttachmentDownload;
