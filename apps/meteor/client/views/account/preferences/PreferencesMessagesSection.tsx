import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUserPreference, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';
import type { FormSectionProps } from './AccountPreferencesPage';

type Values = {
	unreadAlert: boolean;
	alsoSendThreadToChannel: 'default' | 'always' | 'never';
	useEmojis: boolean;
	convertAsciiEmoji: boolean;
	autoImageLoad: boolean;
	saveMobileBandwidth: boolean;
	collapseMediaByDefault: boolean;
	hideUsernames: boolean;
	hideRoles: boolean;
	hideFlexTab: boolean;
	displayAvatars: boolean;
	clockMode: 0 | 1 | 2;
	sendOnEnter: 'normal' | 'alternative' | 'desktop';
	messageViewMode: 0 | 1 | 2;
};

const PreferencesMessagesSection = ({ onChange, commitRef, ...props }: FormSectionProps): ReactElement => {
	const t = useTranslation();

	const showRoles = useSetting('UI_DisplayRoles');

	const settings = {
		unreadAlert: useUserPreference('unreadAlert'),
		alsoSendThreadToChannel: useUserPreference('alsoSendThreadToChannel'),
		useEmojis: useUserPreference('useEmojis'),
		convertAsciiEmoji: useUserPreference('convertAsciiEmoji'),
		autoImageLoad: useUserPreference('autoImageLoad'),
		saveMobileBandwidth: useUserPreference('saveMobileBandwidth'),
		collapseMediaByDefault: useUserPreference('collapseMediaByDefault'),
		hideUsernames: useUserPreference('hideUsernames'),
		hideRoles: useUserPreference('hideRoles'),
		hideFlexTab: useUserPreference('hideFlexTab'),
		clockMode: useUserPreference('clockMode') ?? 0,
		sendOnEnter: useUserPreference('sendOnEnter'),
		messageViewMode: useUserPreference('messageViewMode'),
		displayAvatars: useUserPreference('displayAvatars'),
	};

	const { values, handlers, commit } = useForm(settings, onChange);

	const {
		unreadAlert,
		alsoSendThreadToChannel,
		useEmojis,
		convertAsciiEmoji,
		autoImageLoad,
		saveMobileBandwidth,
		collapseMediaByDefault,
		hideUsernames,
		hideRoles,
		hideFlexTab,
		displayAvatars,
		clockMode,
		sendOnEnter,
		messageViewMode,
	} = values as Values;

	const {
		handleUnreadAlert,
		handleAlsoSendThreadToChannel,
		handleUseEmojis,
		handleConvertAsciiEmoji,
		handleAutoImageLoad,
		handleSaveMobileBandwidth,
		handleCollapseMediaByDefault,
		handleHideUsernames,
		handleHideRoles,
		handleHideFlexTab,
		handleDisplayAvatars,
		handleClockMode,
		handleSendOnEnter,
		handleMessageViewMode,
	} = handlers;

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
			[0 as any, t('Default')], // TO DO: update SelectOption type to accept number as first item
			[1, t('12_Hour')],
			[2, t('24_Hour')],
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

	const messageViewModeOptions = useMemo(
		(): SelectOption[] => [
			[0 as any, t('Normal')], // TO DO: update SelectOption type to accept number as first item
			[1, t('Cozy')],
			[2, t('Compact')],
		],
		[t],
	);

	commitRef.current.messages = commit;

	// TODO: Weird behaviour when saving clock mode, and then changing it.

	return (
		<Accordion.Item title={t('Messages')} {...props}>
			<FieldGroup>
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Unread_Tray_Icon_Alert')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={unreadAlert} onChange={handleUnreadAlert} />
							</Field.Row>
						</Field>
					),
					[handleUnreadAlert, t, unreadAlert],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Also_send_thread_message_to_channel_behavior')}</Field.Label>
							<Field.Row>
								<Select
									value={alsoSendThreadToChannel}
									onChange={handleAlsoSendThreadToChannel}
									options={alsoSendThreadMessageToChannelOptions}
								/>
							</Field.Row>
							<Field.Hint>{t('Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description')}</Field.Hint>
						</Field>
					),
					[alsoSendThreadToChannel, handleAlsoSendThreadToChannel, t, alsoSendThreadMessageToChannelOptions],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Message_TimeFormat')}</Field.Label>
							<Field.Row>
								<Select value={clockMode} onChange={handleClockMode} options={timeFormatOptions} />
							</Field.Row>
						</Field>
					),
					[clockMode, handleClockMode, t, timeFormatOptions],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Use_Emojis')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={useEmojis} onChange={handleUseEmojis} />
							</Field.Row>
						</Field>
					),
					[handleUseEmojis, t, useEmojis],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Convert_Ascii_Emojis')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={convertAsciiEmoji} onChange={handleConvertAsciiEmoji} />
							</Field.Row>
						</Field>
					),
					[convertAsciiEmoji, handleConvertAsciiEmoji, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Auto_Load_Images')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={autoImageLoad} onChange={handleAutoImageLoad} />
							</Field.Row>
						</Field>
					),
					[autoImageLoad, handleAutoImageLoad, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Save_Mobile_Bandwidth')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={saveMobileBandwidth} onChange={handleSaveMobileBandwidth} />
							</Field.Row>
						</Field>
					),
					[handleSaveMobileBandwidth, saveMobileBandwidth, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Collapse_Embedded_Media_By_Default')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={collapseMediaByDefault} onChange={handleCollapseMediaByDefault} />
							</Field.Row>
						</Field>
					),
					[collapseMediaByDefault, handleCollapseMediaByDefault, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Hide_usernames')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={hideUsernames} onChange={handleHideUsernames} />
							</Field.Row>
						</Field>
					),
					[handleHideUsernames, hideUsernames, t],
				)}
				{useMemo(
					() =>
						showRoles && (
							<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
								<Field.Label>{t('Hide_roles')}</Field.Label>
								<Field.Row>
									<ToggleSwitch checked={hideRoles} onChange={handleHideRoles} />
								</Field.Row>
							</Field>
						),
					[handleHideRoles, hideRoles, showRoles, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Hide_flextab')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={hideFlexTab} onChange={handleHideFlexTab} />
							</Field.Row>
						</Field>
					),
					[handleHideFlexTab, hideFlexTab, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Display_avatars')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={displayAvatars} onChange={handleDisplayAvatars} />
							</Field.Row>
						</Field>
					),
					[handleDisplayAvatars, displayAvatars, t],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Enter_Behaviour')}</Field.Label>
							<Field.Row>
								<Select value={sendOnEnter} onChange={handleSendOnEnter} options={sendOnEnterOptions} />
							</Field.Row>
							<Field.Hint>{t('Enter_Behaviour_Description')}</Field.Hint>
						</Field>
					),
					[handleSendOnEnter, sendOnEnter, sendOnEnterOptions, t],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('View_mode')}</Field.Label>
							<Field.Row>
								<Select value={messageViewMode} onChange={handleMessageViewMode} options={messageViewModeOptions} />
							</Field.Row>
							<Field.Hint>{t('Message_view_mode_info')}</Field.Hint>
						</Field>
					),
					[handleMessageViewMode, messageViewMode, messageViewModeOptions, t],
				)}
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesMessagesSection;
