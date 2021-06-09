import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, useCallback, useMemo } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { useForm } from '../../hooks/useForm';
import { goToRoomById } from '../../lib/goToRoomById';
import CreateChannel from './CreateChannel';

const CreateChannelWithData = ({ onClose, teamId = '', reload }) => {
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
		topic: '',
		announcement: '',
		tags: [],
	};
	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const { users, name, description, type, readOnly, broadcast, encrypted, tags, topic, announcement } = values;
	const {
		handleUsers,
		handleEncrypted,
		handleType,
		handleBroadcast,
		handleReadOnly,
		handleTags,
	} = handlers;

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
		handleTags([]);
		return handleType(value);
	});

	const onChangeBroadcast = useMutableCallback((value) => {
		handleEncrypted(!value);
		handleReadOnly(value);
		return handleBroadcast(value);
	});

	const onChangeTags = useMutableCallback((value, action) => {
		if (!action) {
			if (tags.includes(value)) {
				return;
			}
			return handleTags(value);
		}
		handleTags(tags.filter((current) => current !== value));
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
				announcement,
				topic,
				tags,
				...(teamId && { teamId }),
			},
		};
		let roomData;

		if (type) {
			roomData = await createPrivateChannel(params);
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
		announcement,
		topic,
		tags,
		users,
		reload,
	]);

	return (
		<CreateChannel
			values={values}
			handlers={handlers}
			hasUnsavedChanges={hasUnsavedChanges}
			onChangeUsers={onChangeUsers}
			onChangeTags={onChangeTags}
			onChangeType={onChangeType}
			onChangeBroadcast={onChangeBroadcast}
			canOnlyCreateOneType={canOnlyCreateOneType}
			e2eEnabledForPrivateByDefault={e2eEnabledForPrivateByDefault}
			onClose={onClose}
			onCreate={onCreate}
		/>
	);
};

export default memo(CreateChannelWithData);
