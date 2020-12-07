import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from '../../../../components/VerticalBar';

import { NotificationsPreferences } from '.';

export default {
	title: 'components/basic/NotificationsPreferences',
	component: NotificationsPreferences,
};

const handleOn = {
	turnOn: true,
	muteGroupMentions: false,
	showCounter: true,
};

const handleSwitch = {
	turnOn: () => {},
	muteGroupMentions: () => {},
	showCounter: () => {},
};

const defaultOption = [
	['default', 'Default'],
	['all', 'All_messages'],
	['mentions', 'Mentions'],
	['nothing', 'Nothing'],
];

const handleOptions = {
	alerts: defaultOption,
	audio: defaultOption,
	sound: [
		['none None', 'None'],
		['0 default', 'Default'],
		['chime', 'Chime'],
	],
};

const handleSelect = { desktop: {}, mobile: {}, email: {} };

handleSelect.desktop.alert = 'default';
handleSelect.desktop.audio = 'default';
handleSelect.desktop.sound = 'chime';

handleSelect.mobile.alert = 'mentions';

handleSelect.email.alert = 'nothing';

export const Default = () => <Box height='600px'>
	<VerticalBar>
		<NotificationsPreferences
			handleOn={handleOn}
			handleSwitch={handleSwitch}
			handleOptions={handleOptions}
			handleSelect={handleSelect}
			handleChangeOption={{
				desktopAlert: () => {},
				desktopAudio: () => {},
				mobileAlert: () => {},
				emailAlert: () => {},
			}}
			handleSoundChange={{ desktopSound: () => {} }}
		/>
	</VerticalBar>
</Box>;
