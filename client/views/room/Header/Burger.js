import { ActionButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import { useLayout } from '../../../contexts/LayoutContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const Burger = (props) => {
	const { sidebar } = useLayout();
	const t = useTranslation();
	const onClick = useMutableCallback(() => {
		sidebar.toggle();
	});

	return (
		<ActionButton mie='x4' icon='burger' ghost {...props} title={t('Sidebar')} onClick={onClick} />
	);
};

export default memo(Burger);
