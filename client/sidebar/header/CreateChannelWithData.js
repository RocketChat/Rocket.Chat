import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
// import moment from 'moment';
import React, { memo, useCallback, useMemo } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { useForm } from '../../hooks/useForm';
import { goToRoomById } from '../../lib/goToRoomById';
import CreateChannel from './CreateChannel';

const CreateChannelWithData = ({ onClose, teamId = '', reload }) => {
	const t = useTranslation();
	const createChannel = useEndpointActionExperimental('POST', 'channels.create');
	const createPrivateChannel = useEndpointActionExperimental('POST', 'groups.create');
	const canCreateChannel = usePermission('create-c');
	const canCreatePrivateChannel = usePermission('create-p');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');
	const canOnlyCreateOneType = useMemo(() => {
		if (!canCreateChannel && canCreatePrivateChannel) {
			return 'p';
		}
		if (canCreateChannel && !canCreatePrivateChannel) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreatePrivateChannel]);

	const initialValues = {
		users: [],
		name: '',
		description: '',
		type: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
		readOnly: false,
		encrypted: e2eEnabledForPrivateByDefault ?? false,
		broadcast: false,
		ephemeral: false,
		ephemeralTime: null,
	};
	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const {
		users,
		name,
		description,
		type,
		readOnly,
		broadcast,
		encrypted,
		ephemeral,
		ephemeralTime,
	} = values;
	const {
		handleUsers,
		handleEncrypted,
		handleType,
		handleBroadcast,
		handleReadOnly,
		handleEphemeral,
		handleEphemeralTime,
	} = handlers;

	const defaultOption = [
		['5mins', t('5_mins')],
		['15mins', t('15_mins')],
		['1hr', t('1_hour')],
		['6hr', t('6_hours')],
		['12hr', t('12_hours')],
		['24hr', t('24_hours')],
	];
	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
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
	const onChangeEphemeral = useMutableCallback((value) => handleEphemeral(value));
	const onChangeEphemeralTime = useMutableCallback((value) => {
		handleEphemeralTime(value);
	});
	const onCreate = useCallback(async () => {
		const goToRoom = (rid) => {
			goToRoomById(rid);
		};

		const params = {
			name,
			members: users,
			readOnly,
			extraData: {
				description,
				broadcast,
				encrypted,
				...(teamId && { teamId }),
				ephemeral,
				ephemeralTime,
			},
		};
		let roomData;

		if (type || ephemeral) {
			roomData = await createPrivateChannel(params);
			console.log({ roomData });
			!teamId && goToRoom(roomData.group._id);
		} else {
			roomData = await createChannel(params);
			!teamId && goToRoom(roomData.channel._id);
		}

		onClose();
		reload();
	}, [
		broadcast,
		createChannel,
		createPrivateChannel,
		description,
		encrypted,
		name,
		onClose,
		readOnly,
		teamId,
		type,
		users,
		reload,
		ephemeral,
		ephemeralTime,
	]);

	return (
		<CreateChannel
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			onChangeUsers={onChangeUsers}
			onChangeType={onChangeType}
			onChangeEphemeral={onChangeEphemeral}
			onChangeEphemeralTime={onChangeEphemeralTime}
			onChangeBroadcast={onChangeBroadcast}
			canOnlyCreateOneType={canOnlyCreateOneType}
			e2eEnabledForPrivateByDefault={e2eEnabledForPrivateByDefault}
			onClose={onClose}
			options={defaultOption}
			onCreate={onCreate}
		/>
	);
};

export default memo(CreateChannelWithData);
