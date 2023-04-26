import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import OutlookSettingItem from './OutlookSettingItem';

type OutlookSettingsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
};

const OutlookSettingsList = ({ onClose, onChangeRoute }: OutlookSettingsListProps): ReactElement => {
	const t = useTranslation();

	const [notificationsEnabled, setEnableNotifications] = useState(false);
	const [authEnabled, setEnableAuth] = useState(false);

	const calendarSettings = [
		{
			title: 'Event notifications',
			subTitle: 'By disabling this setting you’ll prevent the app to notify you of upcoming events.',
			link: '#',
			enabled: notificationsEnabled,
			handleEnable: setEnableNotifications,
		},
		{
			title: 'Authentication',
			subTitle: 'This allows for the app to work properly. You’ll have to authenticate again if you disable this.',
			link: '#',
			enabled: authEnabled,
			handleEnable: setEnableAuth,
		},
	];

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='calendar' />
				<VerticalBar.Text>{t('Outlook_calendar_settings')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>
			<VerticalBar.Content paddingInline={0} color='default'>
				{calendarSettings.map((setting) => (
					<OutlookSettingItem {...setting} />
				))}
			</VerticalBar.Content>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onChangeRoute}>{t('Back_to_calendar')}</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default OutlookSettingsList;
