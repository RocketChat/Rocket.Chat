import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import Action from '../Action';

type CollapsibleContentProps = Omit<ComponentProps<typeof Action>, 'icon'> & { collapsed?: boolean };

const CollapsibleContent = ({ collapsed = false, ...props }: CollapsibleContentProps): ReactElement => {
	const t = useTranslation();
	return <Action title={collapsed ? t('Uncollapse') : t('Collapse')} icon={!collapsed ? 'chevron-down' : 'chevron-left'} {...props} />;
};

export default CollapsibleContent;
