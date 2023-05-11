import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useOutlookAuthentication } from '../useOutlookAuthentication';
import OutlookSettingItem from './OutlookSettingItem';

type OutlookSettingsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
};

const OutlookSettingsList = ({ onClose, onChangeRoute }: OutlookSettingsListProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const notifyCalendarEvents = useUserPreference('notifyCalendarEvents') as boolean;
	const { authEnabled, handleDisableAuth } = useOutlookAuthentication({ onChangeRoute });

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
			id: 'notification',
			title: t('Event_notifications'),
			subTitle: t('Event_notifications_description'),
			enabled: notifyCalendarEvents,
			handleEnable: handleNotifyCalendarEvents,
		},
		{
			id: 'authentication',
			title: t('Outlook_authentication'),
			subTitle: t('Outlook_authentication_description'),
			enabled: authEnabled,
			handleEnable: handleDisableAuth,
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
				{calendarSettings.map((setting, index) => {
					if (setting.id === 'authentication' && !setting.enabled) {
						return;
					}

					return <OutlookSettingItem key={index} {...setting} />;
				})}
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
