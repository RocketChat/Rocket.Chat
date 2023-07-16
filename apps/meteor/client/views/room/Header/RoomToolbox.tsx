import { Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { HeaderToolboxAction, HeaderToolboxDivider } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { memo, useRef } from 'react';

// used to open the menu option by keyboard
import { useAutotranslateRoomAction } from '../../../hooks/roomActions/useAutotranslateRoomAction';
import { useChannelSettingsRoomAction } from '../../../hooks/roomActions/useChannelSettingsRoomAction';
import { useCleanHistoryRoomAction } from '../../../hooks/roomActions/useCleanHistoryRoomAction';
import { useContactChatHistoryRoomAction } from '../../../hooks/roomActions/useContactChatHistoryRoomAction';
import { useContactProfileRoomAction } from '../../../hooks/roomActions/useContactProfileRoomAction';
import { useDiscussionsRoomAction } from '../../../hooks/roomActions/useDiscussionsRoomAction';
import { useE2EERoomAction } from '../../../hooks/roomActions/useE2EERoomAction';
import { useExportMessagesRoomAction } from '../../../hooks/roomActions/useExportMessagesRoomAction';
import { useKeyboardShortcutListRoomAction } from '../../../hooks/roomActions/useKeyboardShortcutListRoomAction';
import { useMembersListRoomAction } from '../../../hooks/roomActions/useMembersListRoomAction';
import { useMentionsRoomAction } from '../../../hooks/roomActions/useMentionsRoomAction';
import { useOTRRoomAction } from '../../../hooks/roomActions/useOTRRoomAction';
import { useOmniChannelExternalFrameRoomAction } from '../../../hooks/roomActions/useOmniChannelExternalFrameRoomAction';
import { useOutlookCalenderRoomAction } from '../../../hooks/roomActions/useOutlookCalenderRoomAction';
import { usePinnedMessagesRoomAction } from '../../../hooks/roomActions/usePinnedMessagesRoomAction';
import { usePushNotificationsRoomAction } from '../../../hooks/roomActions/usePushNotificationsRoomAction';
import { useRocketSearchRoomAction } from '../../../hooks/roomActions/useRocketSearchRoomAction';
import { useRoomInfoRoomAction } from '../../../hooks/roomActions/useRoomInfoRoomAction';
import { useStarredMessagesRoomAction } from '../../../hooks/roomActions/useStarredMessagesRoomAction';
import { useStartCallRoomAction } from '../../../hooks/roomActions/useStartCallRoomAction';
import { useTeamChannelsRoomAction } from '../../../hooks/roomActions/useTeamChannelsRoomAction';
import { useTeamInfoRoomAction } from '../../../hooks/roomActions/useTeamInfoRoomAction';
import { useThreadRoomAction } from '../../../hooks/roomActions/useThreadRoomAction';
import { useUploadedFilesListRoomAction } from '../../../hooks/roomActions/useUploadedFilesListRoomAction';
import { useUserInfoGroupRoomAction } from '../../../hooks/roomActions/useUserInfoGroupRoomAction';
import { useUserInfoRoomAction } from '../../../hooks/roomActions/useUserInfoRoomAction';
import { useVoIPRoomInfoRoomAction } from '../../../hooks/roomActions/useVoIPRoomInfoRoomAction';
import { useToolboxContext, useTab, useTabBarOpen } from '../contexts/ToolboxContext';
import type { ToolboxAction, OptionRenderer } from '../lib/Toolbox';

const renderMenuOption: OptionRenderer = ({ label: { title, icon }, ...props }: any): ReactNode => (
	<Option label={title} icon={icon} data-qa-id={`ToolBoxAction-${icon}`} gap={!icon} {...props} />
);

type RoomToolboxProps = {
	className?: string;
};

const RoomToolbox = ({ className }: RoomToolboxProps): ReactElement => {
	const t = useTranslation();
	const tab = useTab();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();
	const hiddenActionRenderers = useRef<{ [key: string]: OptionRenderer }>({});

	const { actions: mapActions } = useToolboxContext();

	const actions = Array.from(mapActions.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const featuredActions = actions.filter((action) => action.featured);
	const filteredActions = actions.filter((action) => !action.featured);
	const visibleActions = isMobile ? [] : filteredActions.slice(0, 6);

	const hiddenActions: Record<string, ToolboxAction> = Object.fromEntries(
		(isMobile ? actions : filteredActions.slice(6))
			.filter((item) => !item.disabled)
			.map((item) => {
				hiddenActionRenderers.current = {
					...hiddenActionRenderers.current,
					[item.id]: item.renderOption || renderMenuOption,
				};
				return [
					item.id,
					{
						label: { title: t(item.title), icon: item.icon },
						action: (): void => {
							openTabBar(item.id);
						},
						...item,
					},
				];
			}),
	);

	const defaultAction = useMutableCallback((actionId) => {
		openTabBar(actionId);
	});

	useAutotranslateRoomAction();
	useChannelSettingsRoomAction();
	useCleanHistoryRoomAction();
	useContactChatHistoryRoomAction();
	useContactProfileRoomAction();
	useDiscussionsRoomAction();
	useE2EERoomAction();
	useExportMessagesRoomAction();
	useKeyboardShortcutListRoomAction();
	useMembersListRoomAction();
	useMentionsRoomAction();
	useOmniChannelExternalFrameRoomAction();
	useOTRRoomAction();
	useOutlookCalenderRoomAction();
	usePinnedMessagesRoomAction();
	usePushNotificationsRoomAction();
	useRocketSearchRoomAction();
	useRoomInfoRoomAction();
	useStarredMessagesRoomAction();
	useStartCallRoomAction();
	useThreadRoomAction();
	useUploadedFilesListRoomAction();
	useUserInfoGroupRoomAction();
	useUserInfoRoomAction();
	useVoIPRoomInfoRoomAction();
	useTeamChannelsRoomAction();
	useTeamInfoRoomAction();

	return (
		<>
			{featuredActions.map(({ renderAction, id, icon, title, action = defaultAction, disabled, tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					pressed: id === tab?.id,
					action,
					disabled,
					...(tooltip && { 'data-tooltip': t(tooltip as TranslationKey) }),
				};

				return renderAction?.(props) ?? <HeaderToolboxAction {...props} key={id} />;
			})}
			{featuredActions.length > 0 && <HeaderToolboxDivider />}
			{visibleActions.map(({ renderAction, id, icon, title, action = defaultAction, disabled, tooltip }, index) => {
				const props = {
					id,
					icon,
					title: t(title),
					className,
					index,
					pressed: id === tab?.id,
					action,
					disabled,
					...(tooltip && { 'data-tooltip': t(tooltip as TranslationKey) }),
				};

				return renderAction?.(props) ?? <HeaderToolboxAction {...props} key={id} />;
			})}
			{(filteredActions.length > 6 || isMobile) && (
				<Menu
					data-qa-id='ToolBox-Menu'
					tiny={!isMobile}
					title={t('Options')}
					maxHeight='initial'
					className={className}
					aria-keyshortcuts='alt'
					tabIndex={-1}
					options={hiddenActions}
					renderItem={({ value, ...props }): ReactElement | null => value && (hiddenActionRenderers.current[value](props) as ReactElement)}
				/>
			)}
		</>
	);
};

export default memo(RoomToolbox);
