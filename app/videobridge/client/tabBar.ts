import { useMemo } from 'react';
import { useStableArray } from '@rocket.chat/fuselage-hooks';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction, ToolboxActionConfig } from '../../../client/channel/lib/Toolbox';

addAction('bbb_video', ({ room }) => {
	const enabled = useSetting('bigbluebutton_Enabled');

	const live = room && room.streamingOptions && room.streamingOptions.type === 'call';

	const enabledDirect = useSetting('bigbluebutton_enable_d');
	const enabledGroup = useSetting('bigbluebutton_enable_p');
	const enabledChannel = useSetting('bigbluebutton_enable_c');

	const groups = useStableArray([
		enabledDirect && 'direct',
		enabledGroup && 'group',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	return useMemo(() => (enabled ? {
		groups,
		id: 'bbb_video',
		title: 'BBB Video Call',
		icon: 'phone',
		template: 'videoFlexTabBbb',
		order: live ? -1 : 0,
		// iconColor: 'red',
		// width: 600,
		// class: () => live && 'live',
	} : null), [enabled, groups, live]);
});

addAction('video', () => {
	const enabled = useSetting('Jitsi_Enabled');

	// const live = room && room.streamingOptions && room.streamingOptions.type === 'call';
	const enabledChannel = useSetting('Jitsi_Enable_Channels');

	const groups = useStableArray([
		'direct',
		'group',
		'live',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	return useMemo(() => (enabled ? {
		groups,
		id: 'video',
		title: 'Call',
		icon: 'phone',
		template: 'videoFlexTab',
		order: 0,
		// iconColor: 'red',
		// width: 600,
	} : null), [enabled, groups]);
});
