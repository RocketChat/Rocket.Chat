import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import { useAdministrationHighlight } from './hooks/useAdministrationHighlight';
import { useAdministrationMenu } from './hooks/useAdministrationMenu';

const Administration: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = ({ className, ...props }) => {
	const t = useTranslation();

	const sections = useAdministrationMenu();
	const { className: highlightDot } = useAdministrationHighlight();

	return (
		<GenericMenu
			sections={sections}
			title={t('Administration')}
			is={Sidebar.TopBar.Action}
			className={[className, highlightDot]}
			{...props}
		/>
	);
};

export default Administration;
