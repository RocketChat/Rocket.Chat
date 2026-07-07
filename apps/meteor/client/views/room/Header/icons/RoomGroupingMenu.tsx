import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Box, Position, Tile } from '@rocket.chat/fuselage';
import { HeaderToolbarAction } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../../components/Emoji';
import { useCustomCategories } from '../../../navigation/hooks/useCustomCategories';
import MoveToList from '../../../navigation/sidebar/categories/MoveToList';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

/**
 * Room-header grouping control. It uses the same `HeaderToolbarAction` button (and size) as the
 * right-side room actions. The leading content reflects the room's current grouping: the category's
 * emoji when set, otherwise filled star = favorited, folder = in a custom category, outline star =
 * neither. Opens the same "Move to" list used by the sidebar room kebab submenu.
 */
const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f'] } }) => {
	const { t } = useTranslation();
	const subscribed = useUserIsSubscribed();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true) && ['c', 'p', 'd', 't'].includes(room.t);

	const { getRoomCategory } = useCustomCategories();

	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLElement>(null);
	const [open, setOpen] = useState(false);
	const close = useCallback(() => setOpen(false), []);

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

	if (!subscribed || !isFavoritesEnabled) {
		return null;
	}

	const favorite = Boolean(room.f);
	const category = getRoomCategory(room._id);
	// A non-favorited room in a custom category with an emoji shows that emoji; otherwise an icon.
	const emoji = !favorite && category?.icon ? category.icon : undefined;
	const getGroupingIcon = () => {
		if (favorite) {
			return 'star-filled' as const;
		}
		return category ? ('folder' as const) : ('star' as const);
	};

	// `IconButton` `small` renders icons at x20, so the emoji is sized to match.
	const groupingIcon = emoji ? (
		<Box display='inline-flex' size='x20'>
			<Emoji emojiHandle={`:${emoji}:`} fillContainer />
		</Box>
	) : (
		getGroupingIcon()
	);

	return (
		<>
			<HeaderToolbarAction
				ref={triggerRef}
				mie={4}
				pressed={open}
				icon={groupingIcon}
				title={t('Move_to')}
				onClick={() => setOpen((value) => !value)}
			/>
			{open && (
				<Position anchor={triggerRef} placement='bottom-start'>
					<Tile ref={popoverRef} elevation='2' pb={8} pi={0} width='x224' role='menu'>
						<MoveToList room={{ rid: room._id, name: room.name || '', isFavorite: favorite }} onSelect={close} />
					</Tile>
				</Position>
			)}
		</>
	);
};

export default memo(RoomGroupingMenu);
