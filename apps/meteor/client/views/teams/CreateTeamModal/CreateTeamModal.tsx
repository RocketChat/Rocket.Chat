import type { IUser } from '@rocket.chat/core-typings';
import { Box, Modal, ButtonGroup, Button, TextInput, Field, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useEndpointActionExperimental } from '../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../hooks/useForm';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import TeamNameInput from './TeamNameInput';
import UsersInput from './UsersInput';

type CreateTeamModalState = {
	name: any;
	nameError: any;
	onChangeName: any;
	description: any;
	onChangeDescription: any;
	type: any;
	onChangeType: any;
	readOnly: any;
	canChangeReadOnly: any;
	onChangeReadOnly: any;
	encrypted: any;
	canChangeEncrypted: any;
	onChangeEncrypted: any;
	broadcast: any;
	onChangeBroadcast: any;
	members: any;
	onChangeMembers: any;
	hasUnsavedChanges: any;
	isCreateButtonEnabled: any;
	onCreate: any;
};

const useCreateTeamModalState = (onClose: () => void): CreateTeamModalState => {
	const e2eEnabled = useSetting('E2E_Enable');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');

	const { values, handlers, hasUnsavedChanges } = useForm({
		members: [],
		name: '',
		description: '',
		type: true,
		readOnly: false,
		encrypted: e2eEnabledForPrivateByDefault ?? false,
		broadcast: false,
	});

	const { name, description, type, readOnly, broadcast, encrypted, members } = values as {
		name: string;
		description: string;
		type: boolean;
		readOnly: boolean;
		broadcast: boolean;
		encrypted: boolean;
		members: Exclude<IUser['username'], undefined>[];
	};

	const { handleMembers, handleEncrypted, handleType, handleBroadcast, handleReadOnly } = handlers;

	const t = useTranslation();

	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${namesValidation}$`);
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState<string>();

	const teamNameExists = useMethod('roomNameExists');

	const checkName = useDebouncedCallback(
		async (name: string) => {
			setNameError(undefined);

			if (!hasUnsavedChanges) {
				return;
			}

			if (!name || name.length === 0) {
				setNameError(t('Field_required'));
				return;
			}

			if (teamNameRegex && !teamNameRegex.test(name)) {
				setNameError(t('error-invalid-name'));
				return;
			}

			const isNotAvailable = await teamNameExists(name);
			if (isNotAvailable) {
				setNameError(t('Teams_Errors_team_name', { name }));
			}
		},
		230,
		[name],
	);

	useEffect(() => {
		checkName(name);
	}, [checkName, name]);

	const canChangeReadOnly = !broadcast;

	const canChangeEncrypted = type && !broadcast && e2eEnabled && !e2eEnabledForPrivateByDefault;

	const onChangeName = handlers.handleName;

	const onChangeDescription = handlers.handleDescription;

	const onChangeType = useMutableCallback((value) => {
		handleEncrypted(!value);
		return handleType(value);
	});

	const onChangeReadOnly = handlers.handleReadOnly;

	const onChangeEncrypted = handlers.handleEncrypted;

	const onChangeBroadcast = useCallback(
		(value) => {
			handleEncrypted(!value);
			handleReadOnly(value);
			return handleBroadcast(value);
		},
		[handleBroadcast, handleEncrypted, handleReadOnly],
	);

	const onChangeMembers = useCallback(
		(value, action) => {
			if (!action) {
				if (members.includes(value)) {
					return;
				}
				return handleMembers([...members, value]);
			}
			handleMembers(members.filter((current) => current !== value));
		},
		[handleMembers, members],
	);

	const canSave = hasUnsavedChanges && !nameError;
	const canCreateTeam = usePermission('create-team');
	const isCreateButtonEnabled = canSave && canCreateTeam;

	const createTeam = useEndpointActionExperimental('POST', 'teams.create');

	const onCreate = useCallback(async () => {
		const params = {
			name,
			members,
			type: type ? 1 : 0,
			room: {
				readOnly,
				extraData: {
					description,
					broadcast,
					encrypted,
				},
			},
		};

		const data = await createTeam(params);

		goToRoomById(data.team.roomId);

		onClose();
	}, [name, members, type, readOnly, description, broadcast, encrypted, createTeam, onClose]);

	return {
		name,
		nameError,
		onChangeName,
		description,
		onChangeDescription,
		type,
		onChangeType,
		readOnly,
		canChangeReadOnly,
		onChangeReadOnly,
		encrypted,
		canChangeEncrypted,
		onChangeEncrypted,
		broadcast,
		onChangeBroadcast,
		members,
		onChangeMembers,
		hasUnsavedChanges,
		isCreateButtonEnabled,
		onCreate,
	};
};

type CreateTeamModalProps = {
	onClose: () => void;
};

const CreateTeamModal: FC<CreateTeamModalProps> = ({ onClose }) => {
	const {
		name,
		nameError,
		onChangeName,
		description,
		onChangeDescription,
		type,
		onChangeType,
		readOnly,
		canChangeReadOnly,
		onChangeReadOnly,
		encrypted,
		canChangeEncrypted,
		onChangeEncrypted,
		broadcast,
		onChangeBroadcast,
		members,
		onChangeMembers,
		hasUnsavedChanges,
		isCreateButtonEnabled,
		onCreate,
	} = useCreateTeamModalState(onClose);

	const t = useTranslation();

	const focusRef = useAutoFocus<HTMLInputElement>();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Teams_New_Title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Teams_New_Name_Label')}</Field.Label>
						<Field.Row>
							<TeamNameInput
								ref={focusRef}
								private={type}
								error={hasUnsavedChanges ? nameError : undefined}
								value={name}
								onChange={onChangeName}
							/>
						</Field.Row>
						{hasUnsavedChanges && nameError && <Field.Error>{nameError}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>
							{t('Teams_New_Description_Label')}{' '}
							<Box is='span' color='neutral-600'>
								({t('optional')})
							</Box>
						</Field.Label>
						<Field.Row>
							<TextInput placeholder={t('Teams_New_Description_Placeholder')} value={description} onChange={onChangeDescription} />
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Private_Label')}</Field.Label>
								<Field.Description>
									{type ? t('Teams_New_Private_Description_Enabled') : t('Teams_New_Private_Description_Disabled')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={type} onChange={onChangeType} />
						</Box>
					</Field>
					<Field disabled={!canChangeReadOnly}>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Read_only_Label')}</Field.Label>
								<Field.Description>
									{readOnly ? t('Only_authorized_users_can_write_new_messages') : t('Teams_New_Read_only_Description')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={readOnly} disabled={!canChangeReadOnly} onChange={onChangeReadOnly} />
						</Box>
					</Field>
					<Field disabled={!canChangeEncrypted}>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Encrypted_Label')}</Field.Label>
								<Field.Description>
									{type ? t('Teams_New_Encrypted_Description_Enabled') : t('Teams_New_Encrypted_Description_Disabled')}
								</Field.Description>
							</Box>
							<ToggleSwitch checked={encrypted} disabled={!canChangeEncrypted} onChange={onChangeEncrypted} />
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Teams_New_Broadcast_Label')}</Field.Label>
								<Field.Description>{t('Teams_New_Broadcast_Description')}</Field.Description>
							</Box>
							<ToggleSwitch checked={broadcast} onChange={onChangeBroadcast} />
						</Box>
					</Field>
					<Field>
						<Field.Label>
							{t('Teams_New_Add_members_Label')}{' '}
							<Box is='span' color='neutral-600'>
								({t('optional')})
							</Box>
						</Field.Label>
						<UsersInput value={members} onChange={onChangeMembers} />
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isCreateButtonEnabled} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateTeamModal);
