import { MenuV2, MenuSection, MenuItem } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenuItem';
import GenericMenuContent from '../../../components/GenericMenuItem';
import { useHandleMenuAction } from '../../../hooks/useHandleMenuAction';
import { useCreateRoom } from './hooks/useCreateRoomMenu';

const CreateRoom: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = () => {
	const t = useTranslation();

	const sections = useCreateRoom();
	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items);

	return (
		<MenuV2 icon='edit-rounded' title={t('Create_new')} onAction={handleAction}>
			{sections.map(({ title, items }, key) => (
				<MenuSection title={t.has(title) ? t(title) : title} items={items} key={`${title}-${key}`}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuContent {...item} />
						</MenuItem>
					)}
				</MenuSection>
			))}
		</MenuV2>
	);
};

export default CreateRoom;
