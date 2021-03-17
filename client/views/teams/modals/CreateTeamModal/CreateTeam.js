import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutableCallback, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Modal, ButtonGroup, Button, TextInput, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useForm } from '../../../../hooks/useForm';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import { useSetting } from '../../../../contexts/SettingsContext';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useMethod } from '../../../../contexts/ServerContext';
import TeamNameInput from './TeamNameInput';
import UsersInput from './UsersInput';

export const CreateTeam = ({
	values,
	handlers,
	hasUnsavedChanges,
	onChangeMembers,
	onChangeType,
	onChangeBroadcast,
	canCreateTeam,
	e2eEnabledForPrivateByDefault,
	onCreate,
	onClose,
}) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const namesValidation = useSetting('UTF8_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const teamNameExists = useMethod('roomNameExists');
	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return '';
		}
		const regex = new RegExp(`^${ namesValidation }$`);

		return regex;
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState();

	const checkName = useDebouncedCallback(async (name) => {
		setNameError('');
		if (hasUnsavedChanges) { return; }
		if (!name || name.length === 0) { return setNameError(t('Field_required')); }
		if (!teamNameRegex.test(name)) { return setNameError(t('error-invalid-name')); }
		const isNotAvailable = await teamNameExists(name);
		if (isNotAvailable) { return setNameError(t('Channel_already_exist', name)); }
	}, 100, [name]);

	useEffect(() => {
		checkName(values.name);
	}, [checkName, values.name]);

	const e2edisabled = useMemo(() => !values.type || values.broadcast || !e2eEnabled || e2eEnabledForPrivateByDefault, [e2eEnabled, e2eEnabledForPrivateByDefault, values.broadcast, values.type]);

	const canSave = useMemo(() => hasUnsavedChanges && !nameError, [hasUnsavedChanges, nameError]);

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Create_team')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TeamNameInput private={values.type} error={hasUnsavedChanges ? nameError : undefined} onChange={handlers.handleName} />
				</Field.Row>
				{hasUnsavedChanges && nameError && <Field.Error>
					{nameError}
				</Field.Error>}
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Topic')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Team_what_is_this_team_about')} onChange={handlers.handleDescription}/>
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Private')}</Field.Label>
						<Field.Description>{values.type ? t('Only_invited_users_can_acess_this_channel') : t('Everyone_can_access_this_channel')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.type} onChange={onChangeType}/>
				</Box>
			</Field>
			<Field mbe='x24' disabled={values.broadcast}>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Read_only')}</Field.Label>
						<Field.Description>{t('All_users_in_the_channel_can_write_new_messages')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.readOnly} disabled={values.broadcast} onChange={handlers.handleReadOnly}/>
				</Box>
			</Field>
			<Field disabled={e2edisabled} mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Encrypted')}</Field.Label>
						<Field.Description>{values.type ? t('Encrypted_channel_Description') : t('Encrypted_not_available')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.encrypted} disabled={e2edisabled} onChange={handlers.handleEncrypted} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Broadcast')}</Field.Label>
						<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.broadcast} onChange={onChangeBroadcast} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{`${ t('Add_members') } (${ t('optional') })`}</Field.Label>
				<UsersInput value={values.members} onChange={onChangeMembers} />
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button disabled={!canSave && !canCreateTeam} onClick={onCreate} primary>{t('Create')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default memo(({
	onClose,
}) => {
	const createTeam = useEndpointActionExperimental('POST', 'teams.create');
	const canCreateTeam = usePermission('create-team');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');

	const initialValues = {
		members: [],
		name: '',
		description: '',
		type: true,
		readOnly: false,
		encrypted: e2eEnabledForPrivateByDefault ?? false,
		broadcast: false,
	};
	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const {
		members,
		name,
		type,
		description,
		readOnly,
		broadcast,
		encrypted,
	} = values;
	const {
		handleMembers,
		handleEncrypted,
		handleType,
		handleBroadcast,
		handleReadOnly,
	} = handlers;

	const onChangeMembers = useMutableCallback((value, action) => {
		if (!action) {
			if (members.includes(value)) {
				return;
			}
			return handleMembers([...members, value]);
		}
		handleMembers(members.filter((current) => current !== value));
	});

	const onChangeType = useMutableCallback((value) => {
		handleEncrypted(!value);
		return handleType(value);
	});

	const onChangeBroadcast = useMutableCallback((value) => {
		handleEncrypted(!value);
		handleReadOnly(value);
		return handleBroadcast(value);
	});

	const onCreate = useCallback(async () => {
		const goToRoom = (rid) => {
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

	return <CreateTeam
		values={values}
		handlers={handlers}
		hasUnsavedChanges={hasUnsavedChanges}
		onChangeMembers={onChangeMembers}
		onChangeType={onChangeType}
		onChangeBroadcast={onChangeBroadcast}
		canCreateTeam={canCreateTeam}
		e2eEnabledForPrivateByDefault={e2eEnabledForPrivateByDefault}
		onClose={onClose}
		onCreate={onCreate}
	/>;
});
