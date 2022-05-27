import { Accordion, Field, Select, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUserPreference, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC, useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';
import { useAccountPreferencesForm } from '../contexts/AccountPreferencesFormContext';

type PreferencesMessagesFormValues = {
	unreadAlert: boolean;
	showMessageInMainThread: boolean;
	useEmojis: boolean;
	convertAsciiEmoji: boolean;
	autoImageLoad: boolean;
	saveMobileBandwidth: boolean;
	collapseMediaByDefault: boolean;
	hideUsernames: boolean;
	hideRoles: boolean;
	hideFlexTab: boolean;
	clockMode: number;
	sendOnEnter: string;
	messageViewMode: string;
	displayAvatars: boolean;
};

type PreferencesMessagesSectionProps = Partial<ComponentProps<typeof Accordion.Item>>;

const PreferencesMessagesSection: FC<PreferencesMessagesSectionProps> = ({ ...props }) => {
	const t = useTranslation();
	const { commitRef, onChange } = useAccountPreferencesForm();

	const showRoles = useSetting('UI_DisplayRoles');

	const settings = {
		unreadAlert: useUserPreference('unreadAlert'),
		showMessageInMainThread: useUserPreference('showMessageInMainThread'),
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
		showMessageInMainThread,
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
	} = values as PreferencesMessagesFormValues;

	const {
		handleUnreadAlert,
		handleShowMessageInMainThread,
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

	const timeFormatOptions = useMemo<[string, string][]>(
		() => [
			['0', t('Default')],
			['1', t('12_Hour')],
			['2', t('24_Hour')],
		],
		[t],
	);

	const sendOnEnterOptions = useMemo<[string, string][]>(
		() => [
			['normal', t('Enter_Normal')],
			['alternative', t('Enter_Alternative')],
			['desktop', t('Only_On_Desktop')],
		],
		[t],
	);

	const messageViewModeOptions = useMemo<[string, string][]>(
		() => [
			['0', t('Normal')],
			['1', t('Cozy')],
			['2', t('Compact')],
		],
		[t],
	);

	commitRef.current.messages = commit;

	return (
		<Accordion.Item title={t('Messages')} {...props}>
			<FieldGroup>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Unread_Tray_Icon_Alert')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={unreadAlert} onChange={handleUnreadAlert} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Show_Message_In_Main_Thread')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={showMessageInMainThread} onChange={handleShowMessageInMainThread} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Message_TimeFormat')}</Field.Label>
					<Field.Row>
						<Select value={clockMode} onChange={handleClockMode} options={timeFormatOptions} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Use_Emojis')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={useEmojis} onChange={handleUseEmojis} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Convert_Ascii_Emojis')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={convertAsciiEmoji} onChange={handleConvertAsciiEmoji} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Auto_Load_Images')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={autoImageLoad} onChange={handleAutoImageLoad} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Save_Mobile_Bandwidth')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={saveMobileBandwidth} onChange={handleSaveMobileBandwidth} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Collapse_Embedded_Media_By_Default')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={collapseMediaByDefault} onChange={handleCollapseMediaByDefault} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Hide_usernames')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={hideUsernames} onChange={handleHideUsernames} />
					</Field.Row>
				</Field>
				{showRoles && (
					<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Field.Label>{t('Hide_roles')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={hideRoles} onChange={handleHideRoles} />
						</Field.Row>
					</Field>
				)}
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Hide_flextab')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={hideFlexTab} onChange={handleHideFlexTab} />
					</Field.Row>
				</Field>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Display_avatars')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={displayAvatars} onChange={handleDisplayAvatars} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Enter_Behaviour')}</Field.Label>
					<Field.Row>
						<Select value={sendOnEnter} onChange={handleSendOnEnter} options={sendOnEnterOptions} />
					</Field.Row>
					<Field.Hint>{t('Enter_Behaviour_Description')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('View_mode')}</Field.Label>
					<Field.Row>
						<Select value={messageViewMode} onChange={handleMessageViewMode} options={messageViewModeOptions} />
					</Field.Row>
					<Field.Hint>{t('Message_view_mode_info')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesMessagesSection;
