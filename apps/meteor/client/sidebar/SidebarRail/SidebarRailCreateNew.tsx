import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateNewMenu } from '../../navbar/NavBarPagesGroup/hooks/useCreateNewMenu';

type SidebarRailCreateNewProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailCreateNew = (props: SidebarRailCreateNewProps) => {
	const { t } = useTranslation();

	const sections = useCreateNewMenu();

	if (sections.length === 0) {
		return null;
	}

	return <GenericMenu icon='pencil-box' sections={sections} title={t('Create_new')} is={NavBarItem} placement='right-start' {...props} />;
};

export default SidebarRailCreateNew;
