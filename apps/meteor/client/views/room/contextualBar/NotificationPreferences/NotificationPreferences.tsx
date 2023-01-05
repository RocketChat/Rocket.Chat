import { Button, ButtonGroup, FieldGroup, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import type { NotificationFormValues } from './NotificationPreferencesWithData';
import NotificationByDevice from './components/NotificationByDevice';
import NotificationToogle from './components/NotificationToogle';
import { Preferences } from './components/Preferences';

type NotificationPreferencesProps = {
	handleClose: () => void;
	formValues: NotificationFormValues;
	formHandlers: Record<string, (e: unknown) => void>;
	formHasUnsavedChanges: boolean;
	handlePlaySound: () => void;
	handleOptions: {
		alerts: [string, string][];
		audio: [string, string][];
		sound: [string, string][];
	};
	handleSaveButton: () => void;
};

const NotificationPreferences = ({
	handleClose,
	formValues,
	formHandlers,
	formHasUnsavedChanges,
	handlePlaySound,
	handleOptions,
	handleSaveButton,
}: NotificationPreferencesProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='bell' />
				<VerticalBar.Text>{t('Notifications_Preferences')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<NotificationToogle
					label={t('Turn_ON')}
					description={t('Receive_alerts')}
					onChange={formHandlers?.handleTurnOn}
					defaultChecked={formValues?.turnOn}
				/>
				<NotificationToogle
					label={t('Mute_Group_Mentions')}
					onChange={formHandlers?.handleMuteGroupMentions}
					defaultChecked={formValues?.muteGroupMentions}
				/>
				<NotificationToogle
					label={t('Show_counter')}
					description={t('Display_unread_counter')}
					onChange={formHandlers?.handleShowCounter}
					defaultChecked={formValues?.showCounter}
				/>
				{!formValues?.showCounter && (
					<NotificationToogle
						label={t('Show_mentions')}
						description={t('Display_mentions_counter')}
						onChange={formHandlers?.handleShowMentions}
						defaultChecked={formValues?.showMentions}
					/>
				)}
				<FieldGroup>
					<NotificationByDevice device={t('Desktop')} icon={'computer'}>
						<Preferences
							id={'DesktopAlert'}
							onChange={formHandlers?.handleDesktopAlert}
							name={t('Alerts')}
							options={handleOptions.alerts}
							optionDefault={formValues?.desktopAlert}
						/>
						<Preferences
							id={'DesktopSound'}
							onChange={formHandlers?.handleDesktopSound}
							name={t('Sound')}
							options={handleOptions.sound}
							optionDefault={formValues?.desktopSound}
						>
							<IconButton icon='play' mis='x4' onClick={handlePlaySound} />
						</Preferences>
					</NotificationByDevice>
					<NotificationByDevice device={t('Mobile')} icon={'mobile'}>
						<Preferences
							id={'MobileAlert'}
							onChange={formHandlers?.handleMobileAlert}
							name={t('Alerts')}
							options={handleOptions.alerts}
							optionDefault={formValues?.mobileAlert}
						/>
					</NotificationByDevice>
					<NotificationByDevice device={t('Email')} icon={'mail'}>
						<Preferences
							id={'EmailAlert'}
							onChange={formHandlers?.handleEmailAlert}
							name={t('Alerts')}
							options={handleOptions.alerts}
							optionDefault={formValues?.emailAlert}
						/>
					</NotificationByDevice>
				</FieldGroup>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{handleClose && <Button onClick={handleClose}>{t('Cancel')}</Button>}
					<Button primary disabled={!formHasUnsavedChanges} onClick={handleSaveButton}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default NotificationPreferences;
