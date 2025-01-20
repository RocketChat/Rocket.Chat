import { Sidebar } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateRoom } from './hooks/useCreateRoomMenu';

type CreateRoomProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const CreateRoom = (props: CreateRoomProps) => {
	const { t } = useTranslation();

	const sections = useCreateRoom();

	return <GenericMenu icon='edit-rounded' sections={sections} title={t('Create_new')} is={Sidebar.TopBar.Action} {...props} />;
};

export default CreateRoom;
