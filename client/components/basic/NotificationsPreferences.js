import React from 'react';
import { Box, Button, Divider, FieldGroup, Field, Icon, Select, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';

const NotificationsPreferences = ({
	handleClose,
	formValues,
	formHandlers,
	formHasUnsavedChanges,
	handlePlaySound,
	handleOptions,
	handleSaveButton,
	handleCancelButton,
}) => {
	const t = useTranslation();

	const NotificationToogle = ({ content, children }) => (
		<Box display='flex' justifyContent='space-between' alignItems='start' mbe='x16'>
			<Box display='flex' flexDirection='column'>
				<Field.Label fontScale='p2'>{content.label}</Field.Label>
				<Field.Description fontScale='c1'>{content.description}</Field.Description>
			</Box>
			{children}
		</Box>
	);

	const Preferences = ({ content, children }) => (
		<Box key={content.name} display='flex' flexDirection='column' alignItems='center' justifyContent='space-between' mbe='x12' mi='x16'>
			<Field.Label fontScale='p1' mie='8px'>
				{content.name}
			</Field.Label>
			<Box width='100%' display='flex' alignItems='center'>
				<Select onChange={formHandlers[`handle${ content.id }`]} options={content.options} value={content.optionDefault} />
				{children}
			</Box>
		</Box>
	);

	const NotificationByDevice = ({ content, children }) => (
		<Box mbe='x16'>
			<Box display='flex' alignItems='center' mbe='x16'>
				<Icon name={content.icon} size='x18' />
				<Box mis='x16' fontScale='p2'>{content.device}</Box>
			</Box>
			{children}
		</Box>
	);

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='bell'/>
			<VerticalBar.Text>{t('Notifications_Preferences')}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			<FieldGroup>
				<NotificationToogle content={{ label: t('Turn_ON'), description: t('Receive_alerts') }}>
					<ToggleSwitch onChange={formHandlers.handleTurnOn} defaultChecked={formValues.turnOn} />
				</NotificationToogle>
				<NotificationToogle content={{ label: t('Mute_Group_Mentions') }}>
					<ToggleSwitch onChange={formHandlers.handleMuteGroupMentions} defaultChecked={formValues.muteGroupMentions} />
				</NotificationToogle>
				<NotificationToogle content={{ label: t('Show_counter'), description: t('Display_unread_counter') }}>
					<ToggleSwitch onChange={formHandlers.handleShowCounter} defaultChecked={formValues.showCounter} />
				</NotificationToogle>
			</FieldGroup>
			<Divider />
			<FieldGroup>
				<NotificationByDevice content={{ device: t('Desktop'), icon: 'computer' }}>
					<Preferences content={{ id: 'DesktopAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: formValues.desktopAlert }} />
					<Preferences content={{ id: 'DesktopAudio', name: t('Audio'), options: handleOptions.audio, optionDefault: formValues.desktopAudio }} />
					<Preferences content={{ id: 'DesktopSound', name: t('Sound'), options: handleOptions.sound, optionDefault: formValues.desktopSound }}>
						<Button mis='x4' square ghost onClick={handlePlaySound}>
							<Icon name='play' size='x18' />
						</Button>
					</Preferences>
				</NotificationByDevice>
				<NotificationByDevice content={{ device: t('Mobile'), icon: 'mobile' }}>
					<Preferences content={{ id: 'MobileAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: formValues.mobileAlert }} />
				</NotificationByDevice>
				<NotificationByDevice content={{ device: t('Email'), icon: 'mail' }}>
					<Preferences content={{ id: 'EmailAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: formValues.emailAlert }} />
				</NotificationByDevice>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<Box display='flex' justifyContent='space-between'>
				<VerticalBar.Button mie='x8' onClick={handleCancelButton}>{t('Cancel')}</VerticalBar.Button>
				<VerticalBar.Button primary disabled={!formHasUnsavedChanges} onClick={handleSaveButton}>{t('Save')}</VerticalBar.Button>
			</Box>
		</VerticalBar.Footer>
	</>;
};

export default React.memo(NotificationsPreferences);
