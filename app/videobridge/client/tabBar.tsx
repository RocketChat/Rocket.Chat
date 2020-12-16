import React, { useMemo } from 'react';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { Option, Badge } from '@rocket.chat/fuselage';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import Header from '../../../client/components/Header';

addAction('bbb_video', ({ room }) => {
	const enabled = useSetting('bigbluebutton_Enabled');
	const t = useTranslation();

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
		renderAction: (props): React.ReactNode => <Header.ToolBoxAction {...props}>
			{live ? <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge> : null}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): React.ReactNode => <Option label={title} title={title} icon={icon} {...props}><Badge title={t('Started_a_video_call')} variant='primary'>!</Badge></Option>,
	} : null), [enabled, groups, live, t]);
});

addAction('video', ({ room }) => {
	const enabled = useSetting('Jitsi_Enabled');
	const t = useTranslation();

	const enabledChannel = useSetting('Jitsi_Enable_Channels');

	const groups = useStableArray([
		'direct',
		'group',
		'live',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	const currentTime = new Date().getTime();
	const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
	const live = jitsiTimeout > currentTime || null;

	return useMemo(() => (enabled ? {
		groups,
		id: 'video',
		title: 'Call',
		icon: 'phone',
		template: 'videoFlexTab',
		order: live ? -1 : 0,
		renderAction: (props): React.ReactNode => <Header.ToolBoxAction {...props}>
			{live && <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge>}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): React.ReactNode => <Option label={title} title={title} icon={icon} {...props}>
			{ live && <Badge title={t('Started_a_video_call')} variant='primary'>!</Badge> }
		</Option>,
	} : null), [enabled, groups, live, t]);
});
