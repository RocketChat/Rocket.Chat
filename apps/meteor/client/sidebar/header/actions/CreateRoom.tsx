import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import { useCreateRoom } from './hooks/useCreateRoomMenu';

const CreateRoom: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();

	const sections = useCreateRoom();

	return <GenericMenu icon='edit-rounded' sections={sections} title={t('Create_new')} is={Sidebar.TopBar.Action} {...props} />;
};

export default CreateRoom;
