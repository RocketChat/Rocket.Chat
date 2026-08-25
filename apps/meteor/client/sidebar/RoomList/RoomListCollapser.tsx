import { Badge, IconButton, SidebarV2CollapseGroup, SidebarV2CollapseGroupMenu } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { usePreventPropagation } from '../../hooks/usePreventPropagation';
import { useDeferredMenuMount } from '../Item/useDeferredMenuMount';
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
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');
	const preventPropagation = usePreventPropagation();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	const title = group.translateTitle ? t(group.title as TranslationKey) : group.title;

	return (
		<SidebarV2CollapseGroup
			title={title}
			expanded={!group.collapsed}
			badge={
				showUnread ? (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				) : undefined
			}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			menu={
				hasLicenseModule ? (
					<SidebarV2CollapseGroupMenu onClick={preventPropagation}>
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
							<IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />
						)}
					</SidebarV2CollapseGroupMenu>
				) : undefined
			}
			aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
			{...props}
		/>
	);
};

export default RoomListCollapser;
