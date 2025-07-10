import { SidebarV2Action } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateNewMenu } from './hooks/useCreateNewMenu';

type CreateRoomProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemCreateNew = (props: CreateRoomProps) => {
	const { t } = useTranslation();

	const sections = useCreateNewMenu();

	return <GenericMenu icon='plus' sections={sections} title={t('Create_new')} is={SidebarV2Action} {...props} />;
};

export default NavBarItemCreateNew;
