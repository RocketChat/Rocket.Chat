import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import GenericMenu from '../../../components/GenericMenu';
import type { GenericMenuItemProps } from '../../../components/GenericMenuItem';
import { useHandleMenuAction } from '../../../hooks/useHandleMenuAction';
import { useCreateRoom } from './hooks/useCreateRoomMenu';

const CreateRoom: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();

	const sections = useCreateRoom();
	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items);

	return (
		<GenericMenu
			icon='edit-rounded'
			sections={sections}
			onAction={handleAction}
			title={t('Create_new')}
			is={Sidebar.TopBar.Action}
			{...props}
		/>
	);
};

export default CreateRoom;
