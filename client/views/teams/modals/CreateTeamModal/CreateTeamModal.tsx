import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { FC, memo, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutableCallback, useDebouncedCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { Box, Modal, ButtonGroup, Button, TextInput, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import { IUser } from '../../../../../definition/IUser';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useForm } from '../../../../hooks/useForm';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import { useSetting } from '../../../../contexts/SettingsContext';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useMethod } from '../../../../contexts/ServerContext';
import TeamNameInput from './TeamNameInput';
import UsersInput from './UsersInput';
import { IRoom } from '../../../../../definition/IRoom';

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
	const namesValidation = useSetting('UTF8_Names_Validation');
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

	const {
		name,
		description,
		type,
		readOnly,
		broadcast,
		encrypted,
		members,
	} = values as {
		name: string;
		description: string;
		type: boolean;
		readOnly: boolean;
		broadcast: boolean;
		encrypted: boolean;
		members: IUser['username'][];
	};

	const {
		handleMembers,
		handleEncrypted,
		handleType,
		handleBroadcast,
		handleReadOnly,
	} = handlers;

	const t = useTranslation();

	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${ namesValidation }$`);
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState<string>();

	const teamNameExists = useMethod('roomNameExists');

	const checkName = useDebouncedCallback(async (name: string) => {
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
			setNameError(t('Teams.Errors.Already_exists', { name }));
		}
	}, 230, [name]);

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

	const onChangeBroadcast = useCallback((value) => {
		handleEncrypted(!value);
		handleReadOnly(value);
		return handleBroadcast(value);
	}, [handleBroadcast, handleEncrypted, handleReadOnly]);

	const onChangeMembers = useCallback((value, action) => {
		if (!action) {
			if (members.includes(value)) {
				return;
			}
			return handleMembers([...members, value]);
		}
		handleMembers(members.filter((current) => current !== value));
	}, [handleMembers, members]);

	const canSave = hasUnsavedChanges && !nameError;
	const canCreateTeam = usePermission('create-team');
	const isCreateButtonEnabled = canSave && canCreateTeam;

	const createTeam = useEndpointActionExperimental('POST', 'teams.create');

	const onCreate = useCallback(async () => {
		const goToRoom = (rid: IRoom['_id']): void => {
			FlowRouter.goToRoomById(rid);
		};

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

		const roomData = await createTeam(params);

		goToRoom(roomData.team.rid);

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

	const focusRef = useAutoFocus() as Ref<HTMLElement>;

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Teams.New.Title')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Teams.New.Name.Label')}</Field.Label>
				<Field.Row>
					<TeamNameInput ref={focusRef} private={type} error={hasUnsavedChanges ? nameError : undefined} value={name} onChange={onChangeName} />
				</Field.Row>
				{hasUnsavedChanges && nameError && <Field.Error>
					{nameError}
				</Field.Error>}
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Topic')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<Field.Row>
					<TextInput
						placeholder={t('Teams.New.Description.Placeholder')}
						value={description}
						onChange={onChangeDescription}
					/>
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Teams.New.Private.Label')}</Field.Label>
						<Field.Description>{type ? t('Teams.New.Private.Description_Enabled') : t('Teams.New.Private.Description_Disabled')}</Field.Description>
					</Box>
					<ToggleSwitch checked={type} onChange={onChangeType}/>
				</Box>
			</Field>
			<Field mbe='x24' disabled={!canChangeReadOnly}>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Teams.New.Read_only.Label')}</Field.Label>
						<Field.Description>{t('Teams.New.Description')}</Field.Description>
					</Box>
					<ToggleSwitch checked={readOnly} disabled={!canChangeReadOnly} onChange={onChangeReadOnly}/>
				</Box>
			</Field>
			<Field disabled={!canChangeEncrypted} mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Teams.New.Encrypted.Label')}</Field.Label>
						<Field.Description>{type ? t('Teams.New.Encrypted.Description_Enabled') : t('Teams.New.Encrypted.Description_Disabled')}</Field.Description>
					</Box>
					<ToggleSwitch checked={encrypted} disabled={!canChangeEncrypted} onChange={onChangeEncrypted} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Teams.New.Broadcast.Label')}</Field.Label>
						<Field.Description>{t('Teams.New.Broadcast.Description')}</Field.Description>
					</Box>
					<ToggleSwitch checked={broadcast} onChange={onChangeBroadcast} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Teams.New.Add_members.Label')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<UsersInput value={members} onChange={onChangeMembers} />
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button disabled={!isCreateButtonEnabled} onClick={onCreate} primary>{t('Create')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default memo(CreateTeamModal);
