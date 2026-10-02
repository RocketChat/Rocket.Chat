import { Badge, Box, Chevron, IconButton, ItemActions, ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
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
	onClick: MouseEventHandler<HTMLButtonElement>;
} & Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'color' | 'is'>;

const RoomListCollapser = ({ group, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onClick, ...props }: RoomListCollapserProps) => {
	const { t } = useTranslation();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(group.unreadInfo);

	const title = group.translateTitle ? t(group.title as TranslationKey) : group.title;

	return (
		<Box
			is='section'
			paddingInline={4}
			aria-label={group.collapsed ? t('Expand_group', { group: title }) : t('Collapse_group', { group: title })}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			{...props}
		>
			<ItemGroupHeader>
				<ItemGroupTitle is='button' aria-expanded={!group.collapsed} onClick={onClick}>
					<Chevron size='x16' right={group.collapsed} />
					<Box is='span' withTruncatedText>
						{title}
					</Box>
				</ItemGroupTitle>
				{group.collapsed && showUnread && (
					<Badge variant={unreadVariant} title={unreadTitle} aria-label={unreadTitle} role='status'>
						{unreadCount.total}
					</Badge>
				)}
				{hasLicenseModule && (
					<ItemActions reveal='hover'>
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
					</ItemActions>
				)}
			</ItemGroupHeader>
		</Box>
	);
};

export default RoomListCollapser;
