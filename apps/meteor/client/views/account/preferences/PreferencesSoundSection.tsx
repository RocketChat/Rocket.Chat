import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup, ToggleSwitch, Tooltip, Box } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useCallback } from 'react';

import { CustomSounds } from '../../../../app/custom-sounds/client';
import { useForm } from '../../../hooks/useForm';
import type { FormSectionProps } from './AccountPreferencesPage';

type Values = {
	newRoomNotification: string;
	newMessageNotification: string;
	muteFocusedConversations: boolean;
	notificationsSoundVolume: number;
};
const useCustomSoundsOptions = (): SelectOption[] => useMemo(() => CustomSounds?.getList?.().map(({ _id, name }) => [_id, name]), []);

const PreferencesSoundSection = ({ onChange, commitRef, ...props }: FormSectionProps): ReactElement => {
	const t = useTranslation();

	const soundsList = useCustomSoundsOptions();

	const settings = {
		newRoomNotification: useUserPreference('newRoomNotification'),
		newMessageNotification: useUserPreference('newMessageNotification'),
		muteFocusedConversations: useUserPreference('muteFocusedConversations'),
		notificationsSoundVolume: useUserPreference('notificationsSoundVolume'),
	};

	const { values, handlers, commit } = useForm(settings, onChange);

	const { newRoomNotification, newMessageNotification, muteFocusedConversations, notificationsSoundVolume } = values as Values;

	const { handleNewRoomNotification, handleNewMessageNotification, handleMuteFocusedConversations, handleNotificationsSoundVolume } =
		handlers;

	const onChangeNotificationsSoundVolume = useCallback(
		(e) => handleNotificationsSoundVolume(Math.max(0, Math.min(Number(e.currentTarget.value), 100))),
		[handleNotificationsSoundVolume],
	);

	commitRef.current.sound = commit;

	return (
		<Accordion.Item title={t('Sound')} {...props}>
			<FieldGroup>
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('New_Room_Notification')}</Field.Label>
							<Field.Row>
								<Select value={newRoomNotification} onChange={handleNewRoomNotification} options={soundsList} />
							</Field.Row>
						</Field>
					),
					[handleNewRoomNotification, newRoomNotification, soundsList, t],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('New_Message_Notification')}</Field.Label>
							<Field.Row>
								<Select value={newMessageNotification} onChange={handleNewMessageNotification} options={soundsList} />
							</Field.Row>
						</Field>
					),
					[handleNewMessageNotification, newMessageNotification, soundsList, t],
				)}
				{useMemo(
					() => (
						<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{t('Mute_Focused_Conversations')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={muteFocusedConversations} onChange={handleMuteFocusedConversations} />
							</Field.Row>
						</Field>
					),
					[handleMuteFocusedConversations, muteFocusedConversations, t],
				)}
				{useMemo(
					() => (
						<Field>
							<Field.Label>{t('Notifications_Sound_Volume')}</Field.Label>
							<Field.Row>
								<Box
									is='input'
									flexGrow={1}
									type='range'
									value={notificationsSoundVolume}
									onChange={onChangeNotificationsSoundVolume}
									min='0'
									max='100'
								/>
								<Tooltip placement='right' mis='x8'>
									{notificationsSoundVolume}
								</Tooltip>
							</Field.Row>
						</Field>
					),
					[notificationsSoundVolume, onChangeNotificationsSoundVolume, t],
				)}
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesSoundSection;
