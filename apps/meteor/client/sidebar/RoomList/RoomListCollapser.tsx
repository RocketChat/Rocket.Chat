import { Badge, IconButton, SidebarCollapseGroup, SidebarCollapseGroupMenu } from '@rocket.chat/fuselage';
import { useDeferredMenuMount, useIsEnterprise } from '@rocket.chat/ui-client';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import CategoryMenu from '../categories/CategoryMenu';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListCollapserProps = {
	group: SidebarRoomListGroup;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onClick: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown'>;

const RoomListCollapser = ({ group, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onClick, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);
	const preventPropagation = usePreventPropagation();

	const title = group.translateTitle ? t(group.title) : group.title;

	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.repeat || !['Enter', 'Space'].includes(event.code)) {
			return;
		}

		event.preventDefault();
		onClick();
	};

	return (
		<SidebarCollapseGroup
			title={title}
			role='listitem'
			empty={group.empty}
			expanded={!group.collapsed}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			menu={
				isEnterprise ? (
					<SidebarCollapseGroupMenu onClick={preventPropagation} onKeyDown={preventPropagation}>
						{menuVisibility ? (
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
						) : (
							<IconButton tabIndex={-1} aria-hidden size='mini' icon='kebab' onPointerDown={mountNow} />
						)}
					</SidebarCollapseGroupMenu>
				) : undefined
			}
			aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			onClick={onClick}
			onKeyDown={toggleOnEnterOrSpace}
			{...props}
		/>
	);
};

export default RoomListCollapser;
