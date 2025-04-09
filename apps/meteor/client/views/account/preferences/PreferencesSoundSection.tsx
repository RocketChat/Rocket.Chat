import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Field, FieldLabel, FieldRow, Select, FieldGroup, ToggleSwitch, FieldHint, Slider } from '@rocket.chat/fuselage';
import { useTranslation, useCustomSound } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesSoundSection = () => {
	const t = useTranslation();

	const customSound = useCustomSound();
	const soundsList: SelectOption[] = customSound.list?.map((value) => [value._id, value.name]) || [];
	const { control, watch } = useFormContext();
	const { newMessageNotification, notificationsSoundVolume = 100, masterVolume = 100, voipRingerVolume = 100 } = watch();

	const newRoomNotificationId = useId();
	const newMessageNotificationId = useId();
	const muteFocusedConversationsId = useId();
	const masterVolumeId = useId();
	const notificationsSoundVolumeId = useId();
	const voipRingerVolumeId = useId();

	return (
		<AccordionItem title={t('Sound')}>
			<FieldGroup>
				<Field>
					<FieldLabel aria-describedby={`${masterVolumeId}-hint`}>{t('Master_volume')}</FieldLabel>
					<FieldHint id={`${masterVolumeId}-hint`} mbe={4}>
						{t('Master_volume_hint')}
					</FieldHint>
					<FieldRow>
						<Controller
							name='masterVolume'
							control={control}
							render={({ field: { onChange, value } }) => (
								<Slider
									aria-label={t('Master_volume')}
									aria-describedby={`${masterVolumeId}-hint`}
									value={value}
									minValue={0}
									maxValue={100}
									onChange={onChange}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel id={notificationsSoundVolumeId}>{t('Notification_volume')}</FieldLabel>
					<FieldHint id={`${notificationsSoundVolumeId}-hint`} mbe={4}>
						{t('Notification_volume_hint')}
					</FieldHint>
					<FieldRow>
						<Controller
							name='notificationsSoundVolume'
							control={control}
							render={({ field: { onChange, value } }) => (
								<Slider
									aria-label={t('Notification_volume')}
									aria-describedby={`${notificationsSoundVolumeId}-hint`}
									value={value}
									minValue={0}
									maxValue={100}
									onChange={(value: number) => {
										const soundVolume = (notificationsSoundVolume * masterVolume) / 100;
										customSound.play(newMessageNotification, { volume: soundVolume / 100 });
										onChange(value);
									}}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel aria-describedby={`${voipRingerVolumeId}-hint`}>{t('Call_ringer_volume')}</FieldLabel>
					<FieldHint id={`${voipRingerVolumeId}-hint`} mbe={4}>
						{t('Call_ringer_volume_hint')}
					</FieldHint>
					<FieldRow>
						<Controller
							name='voipRingerVolume'
							control={control}
							render={({ field: { onChange, value } }) => (
								<Slider
									aria-label={t('Call_ringer_volume')}
									aria-describedby={`${voipRingerVolumeId}-hint`}
									value={value}
									minValue={0}
									maxValue={100}
									onChange={(value: number) => {
										const soundVolume = (voipRingerVolume * masterVolume) / 100;
										customSound.play('telephone', { volume: soundVolume / 100 });
										onChange(value);
									}}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={newRoomNotificationId}>{t('New_Room_Notification')}</FieldLabel>
					<FieldRow>
						<Controller
							name='newRoomNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									id={newRoomNotificationId}
									value={value}
									options={soundsList}
									onChange={(value) => {
										onChange(value);
										customSound.play(String(value), { volume: notificationsSoundVolume / 100 });
									}}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={newMessageNotificationId}>{t('New_Message_Notification')}</FieldLabel>
					<FieldRow>
						<Controller
							name='newMessageNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									id={newMessageNotificationId}
									value={value}
									options={soundsList}
									onChange={(value) => {
										onChange(value);
										customSound.play(String(value), { volume: notificationsSoundVolume / 100 });
									}}
								/>
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={muteFocusedConversationsId}>{t('Mute_Focused_Conversations')}</FieldLabel>
						<Controller
							name='muteFocusedConversations'
							control={control}
							render={({ field: { ref, value, onChange } }) => (
								<ToggleSwitch id={muteFocusedConversationsId} ref={ref} checked={value} onChange={onChange} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesSoundSection;
