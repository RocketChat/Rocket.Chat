import { Field, Box, RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useState, useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import { useForm } from '../../../hooks/useForm';

const notificationOptionsLabelMap = {
	oneHour: 'One Hour',
	oneDay: 'One Day',
	oneWeek: 'One Week',
};

const PreferenceNotificationPauseField = ({ onChange, commitRef }) => {
	const t = useTranslation();
	const userNotificationPausedUntil = useUserPreference('notificationPausedUntil');

	const [customTimeActive, setCustomTimeActive] = useState(false);
	const [pauseTime, setPauseTime] = useState(userNotificationPausedUntil || null);

	const { handlers, commit } = useForm(
		{
			notificationPausedUntil: userNotificationPausedUntil,
		},
		onChange,
	);

	const { handleNotificationPausedUntil } = handlers;

	commitRef.current.notifications = commit;

	const pauseNotificationOptions = useMemo(() => {
		const options = Object.entries(notificationOptionsLabelMap).map(([key, val]) => [key, t(val)]);
		return options;
	}, [t, userNotificationPausedUntil]);

	const handleChoosePauseOption = (e) => {
		const choice = e.target.value;
		let pauseEndTime;
		switch (choice) {
			case 'oneHour':
				pauseEndTime = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
				break;
			case 'oneDay':
				pauseEndTime = moment().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
				break;
			case 'oneWeek':
				pauseEndTime = moment().add(1, 'week').format('YYYY-MM-DD HH:mm:ss');
				break;
			default:
				setCustomTimeActive(true);
				pauseEndTime = moment().format('YYYY-MM-DD HH:mm:ss');
				break;
		}
		if (choice !== 'custom') {
			setCustomTimeActive(false);
		}
		setPauseTime(pauseEndTime);

		handleNotificationPausedUntil(moment(pauseEndTime).format('YYYY-MM-DD HH:mm:ss'));
	};

	const handleCustomTimeChange = (e) => {
		setPauseTime(e.target.value);
		handleNotificationPausedUntil(moment(e.target.value).format('YYYY-MM-DD HH:mm:ss'));
	};

	const handleStartNotifications = (e) => {
		if (!e.target.checked) {
			setPauseTime(null);
			handleNotificationPausedUntil(null);
		} else {
			setPauseTime(userNotificationPausedUntil);
			handleNotificationPausedUntil(userNotificationPausedUntil);
		}
	};

	return (
		<Field>
			<Field.Label>{t('Notification Pause Settings')}</Field.Label>
			<Field.Row>
				{userNotificationPausedUntil && (
					<>
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label style={{ paddingLeft: 0 }}>
								Notifications are paused till{' '}
								{moment(userNotificationPausedUntil).format('DD-MMM-YYYY HH:mm:ss')}
							</Field.Label>
							<Field.Row>
								<ToggleSwitch onChange={handleStartNotifications} checked={pauseTime} />
							</Field.Row>
						</Field>
					</>
				)}
				{!userNotificationPausedUntil && (
					<>
						<Box display='flex' flexDirection='column'>
							{pauseNotificationOptions.map(([key, val], id) => {
								const htmlId = `PAUSE_NOTIFICATION_OPTION-${id}`;
								return (
									<Box display='flex' flexDirection='row' key={id.toString()}>
										<RadioButton
											name='PAUSE_NOTIFICATION_OPTIONS'
											value={key}
											onChange={handleChoosePauseOption}
											id={htmlId}
										/>
										<Field.Label htmlFor={id}>{val}</Field.Label>
									</Box>
								);
							})}
							<Box display='flex' flexDirection='row'>
								<RadioButton
									name='PAUSE_NOTIFICATION_OPTIONS'
									value={'custom'}
									onChange={handleChoosePauseOption}
									id={'PAUSE_NOTIFICATION_OPTION-custom'}
								/>
								<Field.Label htmlFor={'PAUSE_NOTIFICATION_OPTION-custom'}>
									{t('Choose Custom Time')}
								</Field.Label>
								{customTimeActive && (
									<Box style={{ marginLeft: 10 }}>
										<input type='datetime-local' onChange={handleCustomTimeChange} />
									</Box>
								)}
							</Box>
							{pauseTime && (
								<Box>
									<p>
										Notifications will be paused till{' '}
										{moment(pauseTime).format('DD-MMM-YYYY HH:mm:ss')}
									</p>
								</Box>
							)}
						</Box>
					</>
				)}
			</Field.Row>
		</Field>
	);
};

export default PreferenceNotificationPauseField;
