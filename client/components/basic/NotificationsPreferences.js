import React from 'react';
import { Box, Divider, FieldGroup, Field, Icon, Select, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from './VerticalBar';

const NotificationsPreferences = ({
	handleClose,
	handleOn,
	handleSwitch,
	handleOptions,
	handleChange,
	handleSoundChange,
}) => {
	const t = useTranslation();

	const NotificationToogle = ({ id, content, handleCheck, on }) => (
		<Box display='flex' justifyContent='space-between' alignItems='start' mbe='x16'>
			<Box display='flex' flexDirection='column'>
				<Field.Label fontScale='p2'>{content.label}</Field.Label>
				<Field.Description fontScale='c1'>{content.description}</Field.Description>
			</Box>
			<ToggleSwitch id={id} onChange={handleCheck} defaultChecked={on(id)} />
		</Box>
	);

	const NotificationByDevice = ({ content }) => {
		const preferences = content.preferences.map((value) => {
			const onChangeEvent = value.name === t('Sound') ? handleSoundChange : handleChange;

			return (
				<Box key={value.name} display='flex' flexDirection='column' alignItems='center' justifyContent='space-between' mbe='x12' mi='x16'>
					<Field.Label fontScale='p1' mie='8px'>
						{value.name}
					</Field.Label>
					<Select width='100%' onChange={onChangeEvent} options={value.options} />
				</Box>
			);
		});

		return (
			<Box mbe='x16'>
				<Box display='flex' alignItems='center' mbe='x16'>
					<Icon name={content.icon} size='x18' />
					<Box mis='x16' fontScale='p2'>{content.device}</Box>
				</Box>
				{preferences}
			</Box>
		);
	};

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='bell'/>
				<VerticalBar.Text>{t('Notifications_Preferences')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose}/>}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<FieldGroup>
					<NotificationToogle id='turn_on' on={handleOn} handleCheck={handleSwitch} content={{ label: t('Turn_ON'), description: t('Receive_alerts') }} />
					<NotificationToogle id='mute_group_mentions' on={handleOn} handleCheck={handleSwitch} content={{ label: t('Mute_Group_Mentions') }} />
					<NotificationToogle id='show_counter' on={handleOn} handleCheck={handleSwitch} content={{ label: t('Show_counter'), description: t('Display_unread_counter') }} />
				</FieldGroup>
				<Divider />
				<FieldGroup>
					<NotificationByDevice
						content={{
							device: t('Desktop'),
							icon: 'computer',
							preferences: [
								{
									name: t('Alerts'),
									options: handleOptions('alerts'),
								},
								{
									name: t('Audio'),
									options: handleOptions('audio'),
								},
								{
									name: t('Sound'),
									options: handleOptions('sound'),
								},
							],
						}}
					/>
					<NotificationByDevice
						content={{
							device: t('Mobile'),
							icon: 'mobile',
							preferences: [
								{
									name: t('Alerts'),
									options: handleOptions('alerts'),
								},
							],
						}}
					/>
					<NotificationByDevice
						content={{
							device: t('Email'),
							icon: 'mail',
							preferences: [
								{
									name: t('Alerts'),
									options: handleOptions('alerts'),
								},
							],
						}}
					/>
				</FieldGroup>
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default React.memo(NotificationsPreferences);
