import { SidebarV2Action } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { useCreateRoom } from './hooks/useCreateRoomMenu';

type CreateRoomProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const CreateRoom = (props: CreateRoomProps) => {
	const t = useTranslation();

	const sections = useCreateRoom();

	return <GenericMenu icon='edit-rounded' sections={sections} title={t('Create_new')} is={SidebarV2Action} {...props} />;
};

export default CreateRoom;
