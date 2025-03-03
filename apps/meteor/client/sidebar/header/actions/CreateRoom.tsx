import { Sidebar } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateRoom } from './hooks/useCreateRoomMenu';

type CreateRoomProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const CreateRoom = (props: CreateRoomProps) => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const sections = useCreateRoom();

	return (
		<GenericMenu
			icon='edit-rounded'
			sections={sections}
			title={t('Create_new')}
			is={Sidebar.TopBar.Action}
			disabled={sidebar.isCollapsed}
			{...props}
		/>
	);
};

export default CreateRoom;
