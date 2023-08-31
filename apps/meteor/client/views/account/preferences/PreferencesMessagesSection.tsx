import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesMessagesSection = () => {
	const t = useTranslation();
	const displayRolesEnabled = useSetting('UI_DisplayRoles');
	const { control } = useFormContext();

	const alsoSendThreadMessageToChannelOptions = useMemo(
		(): SelectOption[] => [
			['default', t('Selected_first_reply_unselected_following_replies')],
			['always', t('Selected_by_default')],
			['never', t('Unselected_by_default')],
		],
		[t],
	);

	const timeFormatOptions = useMemo(
		(): SelectOption[] => [
			['0', t('Default')], // TO DO: update SelectOption type to accept number as first item
			['1', t('12_Hour')],
			['2', t('24_Hour')],
		],
		[t],
	);

	const sendOnEnterOptions = useMemo(
		(): SelectOption[] => [
			['normal', t('Enter_Normal')],
			['alternative', t('Enter_Alternative')],
			['desktop', t('Only_On_Desktop')],
		],
		[t],
	);

	const unreadAlertId = useUniqueId();
	const showThreadsInMainChannelId = useUniqueId();
	const alsoSendThreadToChannelId = useUniqueId();
	const clockModeId = useUniqueId();
	const useEmojisId = useUniqueId();
	const convertAsciiEmojiId = useUniqueId();
	const autoImageLoadId = useUniqueId();
	const saveMobileBandwidthId = useUniqueId();
	const collapseMediaByDefaultId = useUniqueId();
	const hideUsernamesId = useUniqueId();
	const hideRolesId = useUniqueId();
	const hideFlexTabId = useUniqueId();
	const displayAvatarsId = useUniqueId();
	const sendOnEnterId = useUniqueId();

	return (
		<Accordion.Item title={t('Messages')}>
			<FieldGroup>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={unreadAlertId}>{t('Unread_Tray_Icon_Alert')}</Field.Label>
						<Field.Row>
							<Controller
								name='unreadAlert'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={unreadAlertId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={showThreadsInMainChannelId}>{t('Always_show_thread_replies_in_main_channel')}</Field.Label>
						<Field.Row>
							<Controller
								name='showThreadsInMainChannel'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch
										aria-describedby={`${showThreadsInMainChannelId}-hint`}
										id={showThreadsInMainChannelId}
										ref={ref}
										checked={value}
										onChange={onChange}
									/>
								)}
							/>
						</Field.Row>
					</Box>
					<Field.Hint id={`${showThreadsInMainChannelId}-hint`}>
						{t('Accounts_Default_User_Preferences_showThreadsInMainChannel_Description')}
					</Field.Hint>
				</Field>
				<Field>
					<Field.Label htmlFor={alsoSendThreadToChannelId}>{t('Also_send_thread_message_to_channel_behavior')}</Field.Label>
					<Field.Row>
						<Controller
							name='alsoSendThreadToChannel'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select
									id={alsoSendThreadToChannelId}
									aria-describedby={`${alsoSendThreadToChannelId}-hint`}
									value={value}
									onChange={onChange}
									options={alsoSendThreadMessageToChannelOptions}
								/>
							)}
						/>
					</Field.Row>
					<Field.Hint id={`${alsoSendThreadToChannelId}-hint`}>
						{t('Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description')}
					</Field.Hint>
				</Field>
				<Field>
					<Field.Label htmlFor={clockModeId}>{t('Message_TimeFormat')}</Field.Label>
					<Field.Row>
						<Controller
							name='clockMode'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select id={clockModeId} value={`${value}`} onChange={onChange} options={timeFormatOptions} />
							)}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={useEmojisId}>{t('Use_Emojis')}</Field.Label>
						<Field.Row>
							<Controller
								name='useEmojis'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={useEmojisId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={convertAsciiEmojiId}>{t('Convert_Ascii_Emojis')}</Field.Label>
						<Field.Row>
							<Controller
								name='convertAsciiEmoji'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={convertAsciiEmojiId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={autoImageLoadId}>{t('Auto_Load_Images')}</Field.Label>
						<Field.Row>
							<Controller
								name='autoImageLoad'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={autoImageLoadId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={saveMobileBandwidthId}>{t('Save_Mobile_Bandwidth')}</Field.Label>
						<Field.Row>
							<Controller
								name='saveMobileBandwidth'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={saveMobileBandwidthId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={collapseMediaByDefaultId}>{t('Collapse_Embedded_Media_By_Default')}</Field.Label>
						<Field.Row>
							<Controller
								name='collapseMediaByDefault'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={collapseMediaByDefaultId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={hideUsernamesId}>{t('Hide_usernames')}</Field.Label>
						<Field.Row>
							<Controller
								name='hideUsernames'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={hideUsernamesId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				{displayRolesEnabled && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label htmlFor={hideRolesId}>{t('Hide_roles')}</Field.Label>
							<Field.Row>
								<Controller
									name='hideRoles'
									control={control}
									render={({ field: { value, onChange, ref } }) => (
										<ToggleSwitch id={hideRolesId} ref={ref} checked={value} onChange={onChange} />
									)}
								/>
							</Field.Row>
						</Box>
					</Field>
				)}
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={hideFlexTabId}>{t('Hide_flextab')}</Field.Label>
						<Field.Row>
							<Controller
								name='hideFlexTab'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={hideFlexTabId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label htmlFor={displayAvatarsId}>{t('Display_avatars')}</Field.Label>
						<Field.Row>
							<Controller
								name='displayAvatars'
								control={control}
								render={({ field: { value, onChange, ref } }) => (
									<ToggleSwitch id={displayAvatarsId} ref={ref} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Field.Label htmlFor={sendOnEnterId}>{t('Enter_Behaviour')}</Field.Label>
					<Field.Row>
						<Controller
							name='sendOnEnter'
							control={control}
							render={({ field: { value, onChange } }) => (
								<Select id={sendOnEnterId} value={value} onChange={onChange} options={sendOnEnterOptions} />
							)}
						/>
					</Field.Row>
					<Field.Hint>{t('Enter_Behaviour_Description')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesMessagesSection;
