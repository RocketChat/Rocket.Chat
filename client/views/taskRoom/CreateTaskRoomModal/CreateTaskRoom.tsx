import {
	Box,
	Modal,
	ButtonGroup,
	Button,
	TextInput,
	Field,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import {
	useMutableCallback,
	useDebouncedCallback,
	useAutoFocus,
} from '@rocket.chat/fuselage-hooks';
import React, { FC, memo, Ref, useCallback, useEffect, useMemo, useState } from 'react';

import { IUser } from '../../../../definition/IUser';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';
import { goToRoomById } from '../../../lib/goToRoomById';
import UsersInput from '../../teams/CreateTeamModal/UsersInput';
import TaskRoomNameInput from './TaskRoomNameInput';

type CreateTaskRoomModalState = {
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

const useCreateTaskModalState = (onClose: () => void): CreateTaskRoomModalState => {
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
		members: IUser['username'][];
	};

	const { handleMembers, handleEncrypted, handleType, handleBroadcast, handleReadOnly } = handlers;

	const t = useTranslation();

	const taskRoomNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${namesValidation}$`);
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState<string>();

	const roomNameExists = useMethod('roomNameExists');

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

			if (taskRoomNameRegex && !taskRoomNameRegex.test(name)) {
				setNameError(t('error-invalid-name'));
				return;
			}

			const isNotAvailable = await roomNameExists(name);
			if (isNotAvailable) {
				setNameError(t('TaskRoom_Errors_team_name', { name }));
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
	const canCreateTaskRoom = usePermission('create-taskRoom');
	const isCreateButtonEnabled = canSave && canCreateTaskRoom;

	const createTaskRoom = useEndpointActionExperimental('POST', 'taskRoom.create');

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

		const data = await createTaskRoom(params);

		goToRoomById(data.taskRoom.roomId);

		onClose();
	}, [name, members, type, readOnly, description, broadcast, encrypted, createTaskRoom, onClose]);

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

type CreateTaskRoomModalProps = {
	onClose: () => void;
};

const CreateTaskRoomModal: FC<CreateTaskRoomModalProps> = ({ onClose }) => {
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
	} = useCreateTaskModalState(onClose);

	const t = useTranslation();

	const focusRef = useAutoFocus() as Ref<HTMLElement>;

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('TaskRoom_New_Title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('TaskRoom_New_Name_Label')}</Field.Label>
					<Field.Row>
						<TaskRoomNameInput
							ref={focusRef}
							private={type}
							error={hasUnsavedChanges ? nameError : undefined}
							value={name}
							onChange={onChangeName}
						/>
					</Field.Row>
					{hasUnsavedChanges && nameError && <Field.Error>{nameError}</Field.Error>}
				</Field>
				<Field mbe='x24'>
					<Field.Label>
						{t('TaskRoom_New_Description_Label')}{' '}
						<Box is='span' color='neutral-600'>
							({t('optional')})
						</Box>
					</Field.Label>
					<Field.Row>
						<TextInput
							placeholder={t('TaskRoom_New_Description_Placeholder')}
							value={description}
							onChange={onChangeDescription}
						/>
					</Field.Row>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Private')}</Field.Label>
							<Field.Description>
								{type
									? t('TaskRoom_New_Private_Description_Enabled')
									: t('TaskRoom_New_Private_Description_Disabled')}
							</Field.Description>
						</Box>
						<ToggleSwitch checked={type} onChange={onChangeType} />
					</Box>
				</Field>
				<Field mbe='x24' disabled={!canChangeReadOnly}>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Read_only')}</Field.Label>
							<Field.Description>{t('TaskRoom_New_Read_only_Description')}</Field.Description>
						</Box>
						<ToggleSwitch
							checked={readOnly}
							disabled={!canChangeReadOnly}
							onChange={onChangeReadOnly}
						/>
					</Box>
				</Field>
				<Field disabled={!canChangeEncrypted} mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Teams_New_Encrypted_Label')}</Field.Label>
							<Field.Description>
								{type
									? t('TaskRoom_New_Encrypted_Description_Enabled')
									: t('TaskRoom_New_Encrypted_Description_Disabled')}
							</Field.Description>
						</Box>
						<ToggleSwitch
							checked={encrypted}
							disabled={!canChangeEncrypted}
							onChange={onChangeEncrypted}
						/>
					</Box>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('TaskRoom_New_Broadcast_Label')}</Field.Label>
							<Field.Description>{t('TaskRoom_New_Broadcast_Description')}</Field.Description>
						</Box>
						<ToggleSwitch checked={broadcast} onChange={onChangeBroadcast} />
					</Box>
				</Field>
				<Field mbe='x24'>
					<Field.Label>
						{t('Add_members')}{' '}
						<Box is='span' color='neutral-600'>
							({t('optional')})
						</Box>
					</Field.Label>
					<UsersInput value={members} onChange={onChangeMembers} />
				</Field>
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

export default memo(CreateTaskRoomModal);
