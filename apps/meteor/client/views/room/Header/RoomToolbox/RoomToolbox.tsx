import type { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, HeaderToolbarAction, HeaderToolbarDivider, useFeaturePreview } from '@rocket.chat/ui-client';
import { useRoomToolbox, type RenderToolboxItemParams, type RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomToolboxActions } from './hooks/useRoomToolboxActions';

type RoomToolboxProps = {
	className?: ComponentProps<typeof Box>['className'];
};

// This is the "Source of Truth" that a mentor would find easy to read/edit
const PREFERRED_ORDER = ['rocket-search', 'thread', 'members-list', 'discussions', 'start-video-call', 'calls', 'channel-settings'];

const RoomToolbox = ({ className }: RoomToolboxProps) => {
	const { t } = useTranslation();
	const toolbox = useRoomToolbox();
	const { featuredActions = [], hiddenActions = [], visibleActions = [] } = useRoomToolboxActions(toolbox);

	// Connect to the actual Rocket.Chat settings toggle
	const isReorderingEnabled = useFeaturePreview('roomHeaderReordering');

	const showKebabMenu = hiddenActions.length > 0;

	const renderDefaultToolboxItem = useEffectEvent(
		({ id, className, icon, title, toolbox: { tab }, action, disabled, tooltip }: RenderToolboxItemParams) => (
			<HeaderToolbarAction
				key={id}
				className={className}
				icon={icon}
				title={t(title)}
				pressed={id === tab?.id}
				onClick={action}
				disabled={disabled}
				tooltip={tooltip}
			/>
		),
	);

	const mapToToolboxItem = (action: RoomToolboxActionConfig) => {
		if (!action?.id) return null;
		return (action.renderToolboxItem ?? renderDefaultToolboxItem)?.({
			...action,
			action: action.action ?? (() => toolbox.openTab(action.id)),
			className,
			toolbox,
		});
	};

	// --- REORDERING LOGIC ---
	const allActions = [...featuredActions, ...visibleActions];
	const sortedActions = [...allActions].sort((a, b) => {
		const indexA = PREFERRED_ORDER.indexOf(a.id);
		const indexB = PREFERRED_ORDER.indexOf(b.id);
		return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
	});

	return (
		<>
			{isReorderingEnabled ? (
				/* EXPERIMENTAL PATH: Unified and Sorted */
				<>
					{sortedActions.map(mapToToolboxItem)}
					{showKebabMenu && <GenericMenu className={className} title={t('Options')} sections={hiddenActions} placement='bottom-end' />}
				</>
			) : (
				/* STABLE PATH: Original Rocket.Chat Layout */
				<>
					{featuredActions.map(mapToToolboxItem)}
					{featuredActions.length > 0 && <HeaderToolbarDivider />}
					{visibleActions.map(mapToToolboxItem)}
					{showKebabMenu && <GenericMenu className={className} title={t('Options')} sections={hiddenActions} placement='bottom-end' />}
				</>
			)}
		</>
	);
};

export default memo(RoomToolbox);
