import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Tooltip, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useCustomSound } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesSoundSection = () => {
	const t = useTranslation();

	const customSound = useCustomSound();
	const soundsList: SelectOption[] = customSound?.getList()?.map((value) => [value._id, value.name]) || [];
	const { control, watch } = useFormContext();
	const { newMessageNotification, notificationsSoundVolume } = watch();

	const newRoomNotificationId = useUniqueId();
	const newMessageNotificationId = useUniqueId();
	const muteFocusedConversationsId = useUniqueId();
	const notificationsSoundVolumeId = useUniqueId();

	return (
		<Accordion.Item title={t('Sound')}>
			<FieldGroup>
				<Field>
					<Field.Label htmlFor={newRoomNotificationId}>{t('New_Room_Notification')}</Field.Label>
					<Field.Row>
						<Controller
							name='newRoomNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									id={newRoomNotificationId}
									value={value}
									onChange={(value) => {
										onChange(value);
										customSound.play(String(value), { volume: notificationsSoundVolume / 100 });
									}}
									options={soundsList}
								/>
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label htmlFor={newMessageNotificationId}>{t('New_Message_Notification')}</Field.Label>
					<Field.Row>
						<Controller
							name='newMessageNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									id={newMessageNotificationId}
									value={value}
									onChange={(value) => {
										onChange(value);
										customSound.play(String(value), { volume: notificationsSoundVolume / 100 });
									}}
									options={soundsList}
								/>
							)}
						/>
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label htmlFor={muteFocusedConversationsId}>{t('Mute_Focused_Conversations')}</Field.Label>
					<Field.Row>
						<Controller
							name='muteFocusedConversations'
							control={control}
							render={({ field: { ref, value, onChange } }) => (
								<ToggleSwitch id={muteFocusedConversationsId} ref={ref} checked={value} onChange={onChange} />
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label htmlFor={notificationsSoundVolumeId}>{t('Notifications_Sound_Volume')}</Field.Label>
					<Field.Row>
						<Controller
							name='notificationsSoundVolume'
							control={control}
							render={({ field: { onChange, value, ref } }) => (
								<Box
									id={notificationsSoundVolumeId}
									ref={ref}
									is='input'
									flexGrow={1}
									type='range'
									min='0'
									max='100'
									value={value}
									onChange={(e: ChangeEvent<HTMLInputElement>) => {
										customSound.play(newMessageNotification, { volume: notificationsSoundVolume / 100 });
										onChange(Math.max(0, Math.min(Number(e.currentTarget.value), 100)));
									}}
								/>
							)}
						/>
						<Tooltip placement='right' mis={8}>
							{notificationsSoundVolume}
						</Tooltip>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesSoundSection;
