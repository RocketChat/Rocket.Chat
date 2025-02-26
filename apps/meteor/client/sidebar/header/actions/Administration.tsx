import { Sidebar } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdministrationMenu } from './hooks/useAdministrationMenu';

type AdministrationProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Administration = (props: AdministrationProps) => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const sections = useAdministrationMenu();

	return (
		<GenericMenu sections={sections} title={t('Administration')} is={Sidebar.TopBar.Action} disabled={sidebar.isCollapsed} {...props} />
	);
};

export default Administration;
