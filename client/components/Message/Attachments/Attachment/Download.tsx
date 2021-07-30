import React, { ComponentProps, FC } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import Action from './Action';

const Download: FC<
	Omit<ComponentProps<typeof Action>, 'icon'> & { title?: string | undefined; href: string }
> = ({ title, href, ...props }) => {
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

export default Download;
