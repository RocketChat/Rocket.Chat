import { Sidebar } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { useAdministrationMenu } from './hooks/useAdministrationMenu';

type AdministrationProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Administration = (props: AdministrationProps) => {
	const t = useTranslation();

	const sections = useAdministrationMenu();

	return <GenericMenu sections={sections} title={t('Administration')} is={Sidebar.TopBar.Action} {...props} />;
};

export default Administration;
