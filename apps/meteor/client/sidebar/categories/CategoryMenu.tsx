import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Menu, MenuItem, MenuItemContent, MenuItemIcon, MenuSection, MenuSubmenuTrigger, ToggleSwitch } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { renderItem } from '@rocket.chat/ui-client';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import { useCreateNewItems } from '../../navbar/NavBarPagesGroup/hooks/useCreateNewItems';
import { useCustomCategories } from '../hooks/useCustomCategories';

type CategoryMenuProps = {
	category?: ISidebarCategory;
	groupKey: string;
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
};

const CategoryMenu = ({
	category,
	groupKey,
	showUnreads,
	keepUnreadsOnTop,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
}: CategoryMenuProps) => {
	const { t } = useTranslation();
	const [isOpen, toggleOpen] = useToggle(false);
	const close = () => toggleOpen(false);

	const { openManage, openDelete } = useCategoryModals();
	const { toggleShowUnreads, toggleKeepUnreadsOnTop, moveRoom } = useCustomCategories();
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread', false);
	const disableAlwaysDisplay = Boolean(sidebarShowUnread) && groupKey !== 'Unread';

	const onCreateSuccess = async (rid: string, name?: string) => {
		if (!category) {
			return;
		}

		await moveRoom({ rid, name, isFavorite: false }, category._id, { silent: true });
	};

	const rawCreateItems = useCreateNewItems({ onCreateSuccess });
	const createItems = category ? rawCreateItems : [];

	const handleToggleShowUnreads = () => toggleShowUnreads(category?._id ?? groupKey);
	const handleToggleKeepUnreadsOnTop = () => toggleKeepUnreadsOnTop(category?._id ?? groupKey);

	const orderItems: GenericMenuItemProps[] = [
		{
			id: 'move-up',
			icon: 'arrow-up',
			content: t('Move_up'),
			disabled: !canMoveUp,
			onClick: () => {
				close();
				onMoveUp();
			},
		},
		{
			id: 'move-down',
			icon: 'arrow-down',
			content: t('Move_down'),
			disabled: !canMoveDown,
			onClick: () => {
				close();
				onMoveDown();
			},
		},
	];

	const manageItems: GenericMenuItemProps[] = category
		? [
				{
					id: 'manage',
					icon: 'cog',
					content: t('Manage'),
					onClick: () => {
						close();
						openManage(category);
					},
				},
				{
					id: 'delete',
					icon: 'trash',
					content: t('Delete'),
					onClick: () => {
						close();
						openDelete(category);
					},
				},
			]
		: [];

	const unreadItems: GenericMenuItemProps[] = [
		{
			id: 'show-unreads',
			icon: 'flag',
			content: t('Always_display'),
			onClick: handleToggleShowUnreads,
			addon: <ToggleSwitch disabled={disableAlwaysDisplay} checked={!disableAlwaysDisplay && showUnreads} onChange={() => undefined} />,
			disabled: disableAlwaysDisplay,
		},
		{
			id: 'keep-unreads-on-top',
			icon: 'sort-amount-down',
			content: t('Keep_on_top'),
			onClick: handleToggleKeepUnreadsOnTop,
			addon: <ToggleSwitch disabled={sidebarShowUnread} checked={!sidebarShowUnread && keepUnreadsOnTop} onChange={() => undefined} />,
			disabled: sidebarShowUnread,
		},
	];

	const allItems = [...orderItems, ...(category ? manageItems : []), ...createItems, ...unreadItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = (key: string | number) => {
		const item = allItems.find((item) => item.id === String(key));
		item?.onClick?.();
	};

	return (
		<Menu
			icon='kebab'
			title={t('Options')}
			mini
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={toggleOpen}
			{...(disabledKeys.length ? { disabledKeys } : {})}
			onAction={handleAction}
		>
			{[
				<MenuSection key='main' aria-label={t('Options')}>
					<>
						{orderItems.map(renderItem)}
						{category && createItems.length > 0 && (
							<MenuSubmenuTrigger key='create-new' textValue={t('Create_new')}>
								<MenuItem aria-label={t('Create_new')}>
									<MenuItemIcon name='plus' />
									<MenuItemContent>{t('Create_new')}</MenuItemContent>
								</MenuItem>
								<MenuSection items={createItems}>{renderItem}</MenuSection>
							</MenuSubmenuTrigger>
						)}
						{category && manageItems.map(renderItem)}
					</>
				</MenuSection>,
				<MenuSection key='unreads' title={t('Unreads')} items={unreadItems}>
					{renderItem}
				</MenuSection>,
			]}
		</Menu>
	);
};

export default CategoryMenu;
