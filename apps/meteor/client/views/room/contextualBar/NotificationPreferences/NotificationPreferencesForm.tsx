import type { SelectOption } from '@rocket.chat/fuselage';
import { FieldGroup, IconButton, Margins } from '@rocket.chat/fuselage';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NotificationByDevice from './components/NotificationByDevice';
import NotificationPreference from './components/NotificationPreference';
import NotificationToggle from './components/NotificationToggle';

type NotificationPreferencesFormProps = {
	notificationOptions: {
		[key: string]: SelectOption[];
	};
	handlePlaySound: () => void;
};

const NotificationPreferencesForm = ({ notificationOptions, handlePlaySound }: NotificationPreferencesFormProps) => {
	const { t } = useTranslation();
	const { watch, control } = useFormContext();

	const { showCounter } = watch();

	return (
		<>
			<Controller
				control={control}
				name='turnOn'
				render={({ field: { value, onChange } }) => (
					<NotificationToggle label={t('Turn_ON')} description={t('Receive_alerts')} onChange={onChange} defaultChecked={value} />
				)}
			/>
			<Controller
				control={control}
				name='muteGroupMentions'
				render={({ field: { value, onChange } }) => (
					<NotificationToggle label={t('Mute_Group_Mentions')} onChange={onChange} defaultChecked={value} />
				)}
			/>
			<Controller
				control={control}
				name='showCounter'
				render={({ field: { value, onChange } }) => (
					<NotificationToggle
						label={t('Show_counter')}
						description={t('Display_unread_counter')}
						onChange={onChange}
						defaultChecked={value}
					/>
				)}
			/>
			{!showCounter && (
				<Controller
					control={control}
					name='showMentions'
					render={({ field: { value, onChange } }) => (
						<NotificationToggle
							label={t('Show_mentions')}
							description={t('Display_mentions_counter')}
							onChange={onChange}
							defaultChecked={value}
						/>
					)}
				/>
			)}
			<FieldGroup>
				<NotificationByDevice device={t('Desktop')} icon='desktop'>
					<Controller
						control={control}
						name='desktopAlert'
						render={({ field: { value, onChange } }) => (
							<NotificationPreference
								id='DesktopAlert'
								name={t('Alerts')}
								options={notificationOptions.alerts}
								optionValue={value}
								onChange={onChange}
							/>
						)}
					/>
					<Margins blockStart={16}>
						<Controller
							control={control}
							name='desktopSound'
							render={({ field: { value, onChange } }) => (
								<NotificationPreference
									id='DesktopSound'
									name={t('Sound')}
									options={notificationOptions.sounds}
									optionValue={value}
									onChange={onChange}
								>
									<IconButton icon='play' mis={4} onClick={handlePlaySound} />
								</NotificationPreference>
							)}
						/>
					</Margins>
				</NotificationByDevice>
				<NotificationByDevice device={t('Mobile')} icon='mobile'>
					<Controller
						control={control}
						name='mobileAlert'
						render={({ field: { value, onChange } }) => (
							<NotificationPreference
								id='MobileAlert'
								name={t('Alerts')}
								options={notificationOptions.alerts}
								optionValue={value}
								onChange={onChange}
							/>
						)}
					/>
				</NotificationByDevice>
				<NotificationByDevice device={t('Email')} icon='mail'>
					<Controller
						control={control}
						name='emailAlert'
						render={({ field: { value, onChange } }) => (
							<NotificationPreference
								id='EmailAlert'
								name={t('Alerts')}
								options={notificationOptions.alerts}
								optionValue={value}
								onChange={onChange}
							/>
						)}
					/>
				</NotificationByDevice>
			</FieldGroup>
		</>
	);
};

export default NotificationPreferencesForm;
