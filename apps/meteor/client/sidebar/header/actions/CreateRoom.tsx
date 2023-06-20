import { MenuV2, MenuSection, MenuItem } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useAtLeastOnePermission, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, Key, VFC } from 'react';
import React from 'react';

import GenericMenuContent from '../../../components/GenericMenuContent';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useCreateRoomItems } from './hooks/useCreateRoomItems';
import { useMatrixFederationItems } from './hooks/useMatrixFederationItems.tsx';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

const CreateRoom: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = () => {
	const t = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const { data } = useIsEnterprise();
	const isMatrixEnabled = useSetting('Federation_Matrix_enabled') && data?.isEnterprise;

	const createRoomItems = useCreateRoomItems();
	const matrixFederationSearchItems = useMatrixFederationItems({ isMatrixEnabled });

	const handleAction = useMutableCallback((id: Key) => {
		const menuItems = [...createRoomItems, ...matrixFederationSearchItems];
		const item = menuItems.find((item) => item.id === id);
		item?.onClick && item.onClick();
	});

	if (!showCreate) {
		return null;
	}

	return (
		<MenuV2 icon='edit-rounded' title={t('Create_new')} onAction={handleAction}>
			<MenuSection title={t('Create_new')} items={createRoomItems}>
				{(item) => (
					<MenuItem key={item.id}>
						<GenericMenuContent item={item} />
					</MenuItem>
				)}
			</MenuSection>
			{isMatrixEnabled &&
				((
					<MenuSection title={t('Explore')} items={matrixFederationSearchItems}>
						{(item) => (
							<MenuItem key={item.id}>
								<GenericMenuContent item={item} />
							</MenuItem>
						)}
					</MenuSection>
				) as any)}
		</MenuV2>
	);
};

export default CreateRoom;
