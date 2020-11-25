import React from 'react';
import { Box, Button, ButtonGroup, FieldGroup, Field, Icon, Select, ToggleSwitch, Accordion } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';

const NotificationsPreferences = ({
	handleClose,
	handleOn,
	handleSwitch,
	handleOptions,
	handleSoundChange,
	handleChangeOption,
	handleSelect,
	handleSaveButton,
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

	const Preferences = ({ content }) => {
		const onChangeEvent = content.name === t('Sound') ? handleSoundChange : handleChangeOption;

		return (
			<Box key={content.name} display='flex' flexDirection='column' alignItems='center' justifyContent='space-between' mbe='x12'>
				<Field.Label fontScale='p1' mie='8px'>
					{content.name}
				</Field.Label>
				<Select width='100%' onChange={onChangeEvent[content.id]} options={content.options} value={content.optionDefault} />
			</Box>
		);
	};

	const NotificationByDevice = ({ content, children }) => (
		<Accordion.Item title={<Box display='flex' alignItems='center'>
			<Icon name={content.icon} size='x18' />
			<Box fontScale='p2' mi='x16'>{content.device}</Box>
		</Box>}>
			{children}
		</Accordion.Item>
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
					<ToggleSwitch onChange={handleSwitch.turnOn} defaultChecked={handleOn.turnOn} />
				</NotificationToogle>
				<NotificationToogle content={{ label: t('Mute_Group_Mentions') }}>
					<ToggleSwitch onChange={handleSwitch.muteGroupMentions} defaultChecked={handleOn.muteGroupMentions} />
				</NotificationToogle>
				<NotificationToogle content={{ label: t('Show_counter'), description: t('Display_unread_counter') }}>
					<ToggleSwitch onChange={handleSwitch.showCounter} defaultChecked={handleOn.showCounter} />
				</NotificationToogle>
			</FieldGroup>
			<FieldGroup>
				<NotificationByDevice content={{ device: t('Desktop'), icon: 'computer' }}>
					<Preferences content={{ id: 'desktopAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: handleSelect.desktop.alert }} />
					<Preferences content={{ id: 'desktopAudio', name: t('Audio'), options: handleOptions.audio, optionDefault: handleSelect.desktop.audio }} />
					<Preferences content={{ id: 'desktopSound', name: t('Sound'), options: handleOptions.sound, optionDefault: handleSelect.desktop.sound }} />
				</NotificationByDevice>
				<NotificationByDevice content={{ device: t('Mobile'), icon: 'mobile' }}>
					<Preferences content={{ id: 'mobileAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: handleSelect.mobile.alert }} />
				</NotificationByDevice>
				<NotificationByDevice content={{ device: t('Email'), icon: 'mail' }}>
					<Preferences content={{ id: 'emailAlert', name: t('Alerts'), options: handleOptions.alerts, optionDefault: handleSelect.email.alert }} />
				</NotificationByDevice>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button onClick={handleClose}>{t('Cancel')}</Button>
				<Button primary onClick={handleSaveButton}>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
};

export default React.memo(NotificationsPreferences);
