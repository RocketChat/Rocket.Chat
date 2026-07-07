import { Box, Icon, IconButton, Option, OptionColumn, OptionDivider, OptionTitle, Position, Tile } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { MouseEvent } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MoveToList from './MoveToList';
import type { MovableRoom } from '../../hooks/useCustomCategories';

type MenuSection = { title?: string; items: GenericMenuItemProps[] };

type RoomMenuWithCategoriesProps = {
	/** Standard room actions (Hide, Mark read, Favorite, Leave, …). */
	sections: MenuSection[];
	room: MovableRoom;
};

/**
 * Sidebar room kebab menu with a real cascading "Move to ▸" submenu.
 *
 * Fuselage's `GenericMenu` (react-aria) can't host a nested flyout, so this renders a custom
 * popover (`Position` + `Tile` + `Option`). The submenu is an absolutely-positioned child of the
 * same popover (a single portal) — nesting a second `Position` portal crashes on teardown.
 */
const RoomMenuWithCategories = ({ sections, room }: RoomMenuWithCategoriesProps) => {
	const { t } = useTranslation();

	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLElement>(null);

	const [open, setOpen] = useState(false);
	const [submenuOpen, setSubmenuOpen] = useState(false);

	const close = useCallback(() => {
		setOpen(false);
		setSubmenuOpen(false);
	}, []);

	useEffect(() => {
		if (!open) {
			return undefined;
		}
		const handlePointerDown = (event: globalThis.MouseEvent) => {
			const node = event.target as Node | null;
			const element = node instanceof Element ? node : (node?.parentElement ?? null);
			// Keep open when the click lands on the trigger or anywhere inside the popover/submenu (both are role="menu").
			if (triggerRef.current?.contains(node) || element?.closest('[role="menu"]')) {
				return;
			}
			close();
		};
		document.addEventListener('mousedown', handlePointerDown, true);
		return () => document.removeEventListener('mousedown', handlePointerDown, true);
	}, [open, close]);

	const handleSelect = (item: GenericMenuItemProps) => (event: MouseEvent<HTMLElement>) => {
		if (item.disabled) {
			return;
		}
		item.onClick?.(event);
		close();
	};

	const renderRow = (item: GenericMenuItemProps) => (
		<Option key={item.id} role='menuitem' icon={item.icon} label={item.content} disabled={item.disabled} onClick={handleSelect(item)}>
			{item.status ? <OptionColumn>{item.status}</OptionColumn> : null}
		</Option>
	);

	// "Move to" replaces the standard Favorite action's slot (favoriting lives in the submenu now).
	const moveTo = (
		<Box key='moveTo' position='relative' onMouseEnter={() => setSubmenuOpen(true)}>
			<Option role='menuitem' icon='folder' label={t('Move_to')} onClick={() => setSubmenuOpen((value) => !value)}>
				<OptionColumn>
					{/* `chevron-left` renders pointing right in @rocket.chat/icons (names are visually inverted). */}
					<Icon name='chevron-left' size='x16' />
				</OptionColumn>
			</Option>
			{submenuOpen && (
				<Tile
					elevation='2'
					pb={8}
					pi={0}
					width='x224'
					role='menu'
					style={{ position: 'absolute', insetInlineStart: '100%', insetBlockStart: 0, zIndex: 50 }}
				>
					<MoveToList room={room} onSelect={close} />
				</Tile>
			)}
		</Box>
	);

	const hasFavoriteAction = sections.some((section) => section.items.some((item) => item.id === 'toggleFavorite'));

	const renderItem = (item: GenericMenuItemProps) => {
		if (item.id === 'toggleFavorite') {
			return moveTo;
		}
		return (
			<Box key={item.id} onMouseEnter={() => setSubmenuOpen(false)}>
				{renderRow(item)}
			</Box>
		);
	};

	return (
		<>
			<IconButton ref={triggerRef} mini icon='kebab' pressed={open} title={t('Options')} onClick={() => setOpen((value) => !value)} />
			{open && (
				<Position anchor={triggerRef} placement='bottom-end'>
					<Tile
						ref={popoverRef}
						elevation='2'
						pb={8}
						pi={0}
						width='x224'
						role='menu'
						style={{ overflow: 'visible' }}
						onKeyDown={(e) => e.key === 'Escape' && close()}
					>
						{sections.map((section, index) => (
							<Fragment key={section.items[0]?.id ?? `section-${index}`}>
								{index > 0 && <OptionDivider />}
								{section.title ? <OptionTitle>{section.title}</OptionTitle> : null}
								{section.items.map(renderItem)}
							</Fragment>
						))}
						{!hasFavoriteAction && moveTo}
					</Tile>
				</Position>
			)}
		</>
	);
};

export default RoomMenuWithCategories;
