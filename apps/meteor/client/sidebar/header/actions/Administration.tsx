import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import { useAdministrationMenu } from './hooks/useAdministrationMenu';

const Administration: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();

	const sections = useAdministrationMenu();
	if (sections.length === 0) {
		return (
			<button disabled={true}>
				<GenericMenu sections={sections} title={t('Administration')} is={Sidebar.TopBar.Action} {...props} />
			</button>
		);
	}
	return <GenericMenu sections={sections} title={t('Administration')} is={Sidebar.TopBar.Action} {...props} />;
};

export default Administration;
