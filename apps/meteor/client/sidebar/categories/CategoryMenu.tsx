import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import CreateChannelModal from '../../navbar/NavBarPagesGroup/actions/CreateChannelModal';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useKeepUnreadsOnTopGroups } from '../hooks/useKeepUnreadsOnTopGroups';
import { useShowUnreadsGroups } from '../hooks/useShowUnreadsGroups';

type CategoryMenuProps = {
	/** Present for a custom category; omitted for a system/standard group. */
	category?: ISidebarCustomCategory;
	/** Collapse/show-unreads identity (category id for custom, translation key for system). */
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
	const [isOpen, setIsOpen] = useState(false);
	const close = () => setIsOpen(false);

	const setModal = useSetModal();
	const { openManage, openDelete } = useCategoryModals();
	const {
		toggleShowUnreads: toggleCustomShowUnreads,
		toggleKeepUnreadsOnTop: toggleCustomKeepUnreadsOnTop,
		moveRoom,
	} = useCustomCategories();
	const { toggleShowUnreads: toggleSystemShowUnreads } = useShowUnreadsGroups();
	const { toggleKeepUnreadsOnTop: toggleSystemKeepUnreadsOnTop } = useKeepUnreadsOnTopGroups();

	const handleNewChannel = () => {
		close();
		const onClose = () => setModal(null);
		setModal(
			<CreateChannelModal
				onClose={onClose}
				onSuccess={category ? (rid, name) => moveRoom({ rid, name, isFavorite: false }, category._id) : undefined}
			/>,
		);
	};

	const handleToggleShowUnreads = () => (category ? toggleCustomShowUnreads(category._id) : toggleSystemShowUnreads(groupKey));
	const handleToggleKeepUnreadsOnTop = () =>
		category ? toggleCustomKeepUnreadsOnTop(category._id) : toggleSystemKeepUnreadsOnTop(groupKey);

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
		...(category
			? ([
					{
						id: 'new-channel',
						icon: 'hash',
						content: t('New_channel'),
						onClick: handleNewChannel,
					},
				] as GenericMenuItemProps[])
			: []),
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
			addon: <ToggleSwitch checked={showUnreads} onChange={() => undefined} />,
		},
		{
			id: 'keep-unreads-on-top',
			icon: 'sort-amount-down',
			content: t('Keep_on_top'),
			onClick: handleToggleKeepUnreadsOnTop,
			addon: <ToggleSwitch checked={keepUnreadsOnTop} onChange={() => undefined} />,
		},
	];

	const sections = [{ items: [...orderItems, ...(category ? manageItems : [])] }, { title: t('Unreads'), items: unreadItems }];

	return (
		<GenericMenu
			title={t('Options')}
			icon='kebab'
			mini
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			sections={sections}
		/>
	);
};

export default CategoryMenu;
