import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC } from 'react';

import Action from './Action';

const Collapse: FC<Omit<ComponentProps<typeof Action>, 'icon'> & { collapsed?: boolean }> = ({ collapsed = false, ...props }) => {
	const t = useTranslation();
	return <Action title={collapsed ? t('Uncollapse') : t('Collapse')} icon={!collapsed ? 'chevron-down' : 'chevron-left'} {...props} />;
};

export default Collapse;
