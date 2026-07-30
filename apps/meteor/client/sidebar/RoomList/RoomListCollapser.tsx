import { Badge, SidebarV2CollapseGroup } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryMenu from '../categories/CategoryMenu';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	group: SidebarRoomListGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onClick: MouseEventHandler<HTMLElement>;
	onKeyDown: (e: KeyboardEvent) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({ group, canMoveUp, canMoveDown, onMoveUp, onMoveDown, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();

	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	const title = group.translateTitle ? t(group.title as TranslationKey) : group.title;

	return (
		<SidebarV2CollapseGroup
			title={title}
			expanded={!group.empty && !group.collapsed}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			menu={
				<CategoryMenu
					category={group.category}
					groupKey={group.key}
					showUnreads={group.showUnreads}
					keepUnreadsOnTop={group.keepUnreadsOnTop}
					canMoveUp={canMoveUp}
					canMoveDown={canMoveDown}
					onMoveUp={onMoveUp}
					onMoveDown={onMoveDown}
				/>
			}
			aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
			{...props}
		/>
	);
};

export default RoomListCollapser;
