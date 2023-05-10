import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useCallback } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { getDesktopApp } from '../../../lib/utils/getDesktopApp';
import OutlookSettingItem from './OutlookSettingItem';

type OutlookSettingsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
};

const OutlookSettingsList = ({ onClose, onChangeRoute }: OutlookSettingsListProps): ReactElement => {
	const t = useTranslation();
	const [authEnabled, setEnableAuth] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const notifyCalendarEvents = useUserPreference('notifyCalendarEvents') as boolean;
	const desktopApp = getDesktopApp();

	desktopApp?.hasOutlookCredentials().then((res) => setEnableAuth(res));

	const handleNotifyCalendarEvents = useCallback(
		(value: boolean) => {
			try {
				saveUserPreferences({ data: { notifyCalendarEvents: value } });
				dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[saveUserPreferences, dispatchToastMessage, t],
	);

	const calendarSettings = [
		{
			title: t('Event_notifications'),
			subTitle: t('Event_notifications_description'),
			enabled: notifyCalendarEvents,
			handleEnable: handleNotifyCalendarEvents,
		},
		{
			title: t('Outlook_authentication'),
			subTitle: t('Outlook_authentication_description'),
			enabled: authEnabled,
			handleEnable: () => {
				desktopApp?.clearOutlookCredentials();
				desktopApp?.hasOutlookCredentials().then((res) => setEnableAuth(res));
			},
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
				{calendarSettings.map((setting, index) => (
					<OutlookSettingItem key={index} {...setting} />
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
