import { IconButton, MenuItem, MenuItemContent, MenuItemIcon, MenuSection, MenuV2 } from '@rocket.chat/fuselage';
import type { Keys as IconKeys } from '@rocket.chat/icons';
import type { Key } from 'react';
import React, { useCallback } from 'react';

type RegularAction = {
	id: string;
	name: string;
	icon: IconKeys;
	action: () => void;
};

type RoomActionsMenuProps = {
	actions: {
		regular: RegularAction[];
		danger: RegularAction[] | null;
	};
};

const RoomActionsMenu = ({ actions }: RoomActionsMenuProps) => {
	const { regular, danger } = actions;

	const itemsList = [regular, danger].reduce((acc, item) => [...(acc || []), ...(item || [])]);

	const onAction = useCallback(
		(id: Key) => {
			const item = itemsList?.find((item) => item.id === id && !!item);

			item?.action?.();
		},
		[itemsList],
	);

	return (
		<MenuV2
			key='menu'
			placement='bottom-end'
			button={<IconButton icon='kebab' secondary flexShrink={0} flexGrow={0} maxHeight='initial' />}
			onAction={onAction}
		>
			<MenuSection items={regular}>
				{(item) => (
					<MenuItem key={item.id}>
						<MenuItemIcon name={item.icon} />
						<MenuItemContent>{item.name}</MenuItemContent>
					</MenuItem>
				)}
			</MenuSection>
			{danger?.length ? (
				<MenuSection items={danger}>
					{(item) => (
						<MenuItem key={item.id}>
							<MenuItemIcon name={item.icon} />
							<MenuItemContent>{item.name}</MenuItemContent>
						</MenuItem>
					)}
				</MenuSection>
			) : (
				<></>
			)}
		</MenuV2>
	);
};

export default RoomActionsMenu;
