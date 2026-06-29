import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Box, IconButton, Option, OptionDivider, OptionInput, OptionTitle, Position, Tile, ToggleSwitch } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import CreateChannelModal from '../../../../navbar/NavBarPagesGroup/actions/CreateChannelModal';
import { useCreateRoomModal } from '../../../../navbar/NavBarPagesGroup/hooks/useCreateRoomModal';
import { useCustomCategories } from '../../hooks/useCustomCategories';
import { useShowUnreadsGroups } from '../../hooks/useShowUnreadsGroups';

type CategoryMenuProps = {
	/** Present for a custom category; omitted for a system/standard group. */
	category?: ISidebarCustomCategory;
	/** Collapse/show-unreads identity (category id for custom, translation key for system). */
	groupKey: string;
	showUnreads: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	/** Reports open/close so the collapser can keep the kebab visible while the menu is open. */
	onOpenChange?: (open: boolean) => void;
};

/**
 * The kebab menu on a sidebar group collapser. Custom categories get the full menu
 * (New channel + Manage: Rename / Delete / New category); system/standard categories get the
 * reduced menu (reorder + New category). Both share the "When closed → Show unreads" toggle.
 * Sidebar-agnostic: used by both the classic and the navigation sidebars.
 */
const CategoryMenu = ({
	category,
	groupKey,
	showUnreads,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onOpenChange,
}: CategoryMenuProps) => {
	const { t } = useTranslation();

	const { openCreate, openRename, openDelete } = useCategoryModals();
	const { toggleShowUnreads: toggleCustomShowUnreads } = useCustomCategories();
	const { toggleShowUnreads: toggleSystemShowUnreads } = useShowUnreadsGroups();
	const createChannel = useCreateRoomModal(CreateChannelModal);

	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpenState] = useState(false);
	const setOpen = useCallback(
		(value: boolean) => {
			setOpenState(value);
			onOpenChange?.(value);
		},
		[onOpenChange],
	);
	const close = useCallback(() => setOpen(false), [setOpen]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}
		const handlePointerDown = (event: globalThis.MouseEvent) => {
			const node = event.target as Node | null;
			const element = node instanceof Element ? node : (node?.parentElement ?? null);
			if (triggerRef.current?.contains(node) || element?.closest('[role="menu"]')) {
				return;
			}
			close();
		};
		document.addEventListener('mousedown', handlePointerDown, true);
		return () => document.removeEventListener('mousedown', handlePointerDown, true);
	}, [open, close]);

	const handleToggleShowUnreads = () => (category ? toggleCustomShowUnreads(category._id) : toggleSystemShowUnreads(groupKey));

	// Run a menu action and close the menu (closing on reorder avoids the popover pointing at a
	// different category once this one changes position).
	const run = (action: () => void) => () => {
		action();
		close();
	};

	return (
		<Box onClick={(e) => e.stopPropagation()}>
			<IconButton ref={triggerRef} mini icon='kebab' pressed={open} title={t('Options')} onClick={() => setOpen(!open)} />
			{open && (
				<Position anchor={triggerRef} placement='bottom-end'>
					<Tile role='menu' elevation='2' pb={8} pi={0} width='x224' onKeyDown={(e) => e.key === 'Escape' && close()}>
						<Option role='menuitem' icon='arrow-up' label={t('Move_up')} disabled={!canMoveUp} onClick={run(onMoveUp)} />
						<Option role='menuitem' icon='arrow-down' label={t('Move_down')} disabled={!canMoveDown} onClick={run(onMoveDown)} />
						{category && <Option role='menuitem' icon='hash' label={t('New_channel')} onClick={run(createChannel)} />}
						{category && <OptionTitle>{t('Manage')}</OptionTitle>}
						{category && <Option role='menuitem' icon='edit' label={t('Rename')} onClick={run(() => openRename(category))} />}
						{category && <Option role='menuitem' icon='trash' label={t('Delete')} onClick={run(() => openDelete(category))} />}
						<Option role='menuitem' icon='folder' label={t('New_category')} onClick={run(() => openCreate())} />
						<OptionDivider />
						<OptionTitle>{t('When_closed')}</OptionTitle>
						<Option
							role='menuitemcheckbox'
							aria-checked={showUnreads}
							icon='flag'
							label={t('Show_unreads')}
							onClick={handleToggleShowUnreads}
						>
							<OptionInput>
								<Box onClick={(e) => e.stopPropagation()}>
									<ToggleSwitch checked={showUnreads} onChange={handleToggleShowUnreads} />
								</Box>
							</OptionInput>
						</Option>
					</Tile>
				</Position>
			)}
		</Box>
	);
};

export default CategoryMenu;
