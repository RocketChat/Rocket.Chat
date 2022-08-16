import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useEndpointActionExperimental } from '../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../hooks/useForm';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

// TODO: Type it correctly when rewrit it using react-hook-form
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

export const useCreateTeamModalState = (onClose: () => void): CreateTeamModalState => {
	const t = useTranslation();
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

	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${namesValidation}$`);
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState<string>();

	const teamNameExists = useEndpoint('GET', '/v1/rooms.nameExists');

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

			const { exists } = await teamNameExists({ roomName: name });
			if (exists) {
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

	const createTeam = useEndpointActionExperimental('POST', '/v1/teams.create');

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
