import React, { useMemo, lazy, ReactNode } from 'react';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { Option, Badge } from '@rocket.chat/fuselage';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useUser } from '../../../client/contexts/UserContext';
import Header from '../../../client/components/Header';

const templateBBB = lazy(() => import('../../../client/views/room/contextualBar/Call/BBB'));

addAction('bbb_video', ({ room }) => {
	const enabled = useSetting('bigbluebutton_Enabled');
	const t = useTranslation();

	const live = room && room.streamingOptions && room.streamingOptions.type === 'call';

	const enabledDirect = useSetting('bigbluebutton_enable_d');
	const enabledGroup = useSetting('bigbluebutton_enable_p');
	const enabledChannel = useSetting('bigbluebutton_enable_c');
	const enabledTeams = useSetting('bigbluebutton_enable_teams');

	const groups = useStableArray([
		enabledDirect && 'direct',
		enabledGroup && 'group',
		enabledTeams && 'team',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);
	const user = useUser();
	const username = user ? user.username : '';
	const enableOption = enabled && (!username || !room.muted?.includes(username));

	return useMemo(() => (enableOption ? {
		groups,
		id: 'bbb_video',
		title: 'BBB_Video_Call',
		icon: 'phone',
		template: templateBBB,
		order: live ? -1 : 4,
		renderAction: (props): ReactNode => <Header.ToolBoxAction {...props}>
			{live ? <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge> : null}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): ReactNode => <Option label={title} title={title} icon={icon} {...props}><Badge title={t('Started_a_video_call')} variant='primary'>!</Badge></Option>,
	} : null), [enableOption, groups, live, t]);
});

const templateJitsi = lazy(() => import('../../../client/views/room/contextualBar/Call/Jitsi'));

addAction('video', ({ room }) => {
	const enabled = useSetting('Jitsi_Enabled');
	const t = useTranslation();

	const enabledChannel = useSetting('Jitsi_Enable_Channels');
	const enabledTeams = useSetting('Jitsi_Enable_Teams');

	const groups = useStableArray([
		'direct',
		'group',
		'live',
		enabledTeams && 'team',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	const currentTime = new Date().getTime();
	const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
	const live = jitsiTimeout > currentTime || null;
	const user = useUser();
	const username = user ? user.username : '';
	const enableOption = enabled && (!username || !room.muted?.includes(username));

	return useMemo(() => (enableOption ? {
		groups,
		id: 'video',
		title: 'Call',
		icon: 'phone',
		template: templateJitsi,
		full: true,
		order: live ? -1 : 4,
		renderAction: (props): ReactNode => <Header.ToolBoxAction {...props}>
			{live && <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge>}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): ReactNode => <Option label={title} title={title} icon={icon} {...props}>
			{ live && <Badge title={t('Started_a_video_call')} variant='primary'>!</Badge> }
		</Option>,
	} : null), [enableOption, groups, live, t]);
});
