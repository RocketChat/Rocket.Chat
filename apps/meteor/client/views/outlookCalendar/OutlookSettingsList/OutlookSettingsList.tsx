import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useTranslation, useUserPreference, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback } from 'react';

import OutlookSettingItem from './OutlookSettingItem';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarFooter,
} from '../../../components/Contextualbar';
import { useOutlookAuthentication, useOutlookAuthenticationMutationLogout } from '../hooks/useOutlookAuthentication';

type OutlookSettingsListProps = {
	onClose: () => void;
	changeRoute: () => void;
};

const OutlookSettingsList = ({ onClose, changeRoute }: OutlookSettingsListProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const notifyCalendarEvents = useUserPreference('notifyCalendarEvents') as boolean;
	const { authEnabled } = useOutlookAuthentication();
	const handleDisableAuth = useOutlookAuthenticationMutationLogout();

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
			handleEnable: () =>
				handleDisableAuth.mutate(undefined, {
					onSuccess: changeRoute,
				}),
		},
	];

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='calendar' />
				<ContextualbarTitle>{t('Outlook_calendar_settings')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0} color='default'>
				{calendarSettings.map((setting, index) => {
					if (setting.id === 'authentication' && !setting.enabled) {
						return;
					}

					return <OutlookSettingItem key={index} {...setting} />;
				})}
			</ContextualbarContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={changeRoute}>{t('Back_to_calendar')}</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default OutlookSettingsList;
