import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Slider } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useCustomSound, useTranslation } from '@rocket.chat/ui-contexts';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesSoundSection = () => {
	const t = useTranslation();

	const customSound = useCustomSound();
	const soundsList: SelectOption[] = customSound.list?.map((value) => [value._id, t(value.name as TranslationKey)]) || [];
	const { control, watch } = useFormContext();
	const { newMessageNotification, notificationsSoundVolume = 100, masterVolume = 100, voipRingerVolume = 100 } = watch();

	return (
		<AccordionItem title={t('Sound')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Master_volume')}</FieldLabel>
					<FieldHint mbe={4}>{t('Master_volume_hint')}</FieldHint>
					<FieldRow>
						<Controller
							name='masterVolume'
							control={control}
							render={({ field: { onChange, value } }) => <Slider value={value} minValue={0} maxValue={100} onChange={onChange} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Notification_volume')}</FieldLabel>
					<FieldHint mbe={4}>{t('Notification_volume_hint')}</FieldHint>
					<FieldRow>
						<Controller
							name='notificationsSoundVolume'
							control={control}
							render={({ field: { onChange, value } }) => (
								<Slider
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
					<FieldLabel>{t('Call_ringer_volume')}</FieldLabel>
					<FieldHint mbe={4}>{t('Call_ringer_volume_hint')}</FieldHint>
					<FieldRow>
						<Controller
							name='voipRingerVolume'
							control={control}
							render={({ field: { onChange, value } }) => (
								<Slider
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
					<FieldLabel>{t('New_Room_Notification')}</FieldLabel>
					<FieldRow>
						<Controller
							name='newRoomNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
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
					<FieldLabel>{t('New_Message_Notification')}</FieldLabel>
					<FieldRow>
						<Controller
							name='newMessageNotification'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
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
						<FieldLabel>{t('Mute_Focused_Conversations')}</FieldLabel>
						<Controller
							name='muteFocusedConversations'
							control={control}
							render={({ field: { ref, value, onChange } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesSoundSection;
