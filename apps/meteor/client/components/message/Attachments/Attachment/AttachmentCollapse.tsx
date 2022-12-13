import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import Action from './AttachmentAction';

const AttachmentCollapse: FC<Omit<ComponentProps<typeof Action>, 'icon'> & { collapsed?: boolean }> = ({ collapsed = false, ...props }) => {
	const t = useTranslation();
	return <Action title={collapsed ? t('Uncollapse') : t('Collapse')} icon={!collapsed ? 'chevron-down' : 'chevron-left'} {...props} />;
};

export default AttachmentCollapse;
