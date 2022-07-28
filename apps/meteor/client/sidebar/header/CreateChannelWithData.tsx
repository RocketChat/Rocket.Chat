import { RoomType } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, usePermission } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useCallback, useMemo, ComponentProps } from 'react';

import { useEndpointActionExperimental } from '../../hooks/useEndpointActionExperimental';
import { useForm } from '../../hooks/useForm';
import { goToRoomById } from '../../lib/utils/goToRoomById';
import CreateChannel, { CreateChannelProps } from './CreateChannel';

type CreateChannelWithDataProps = {
	onClose: () => void;
	teamId?: string;
	reload: () => void;
};

type UseFormValues = {
	users: string[];
	name: string;
	type: RoomType;
	description: string;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	federated: boolean;
};

const CreateChannelWithData = ({ onClose, teamId = '', reload }: CreateChannelWithDataProps): ReactElement => {
	const createChannel = useEndpointActionExperimental('POST', '/v1/channels.create');
	const createPrivateChannel = useEndpointActionExperimental('POST', '/v1/groups.create');
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
		federated: false,
	};
	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const { users, name, description, type, readOnly, broadcast, encrypted, federated } = values as UseFormValues;
	const { handleEncrypted, handleType, handleBroadcast, handleReadOnly, handleFederated } = handlers;

	const onChangeType = useMutableCallback((value) => {
		handleEncrypted(!value);
		return handleType(value);
	});

	const onChangeBroadcast = useMutableCallback((value) => {
		handleEncrypted(!value);
		handleReadOnly(value);
		return handleBroadcast(value);
	});

	const onChangeFederated = useMutableCallback((value) => {
		// if room is federated, it cannot be encrypted
		if (encrypted && value) {
			handleEncrypted(false);
		}

		// if room is federated, it cannot be broadcast
		if (broadcast && value) {
			handleBroadcast(false);
		}

		// if room is federated, it cannot be readonly
		if (readOnly && value) {
			handleReadOnly(false);
		}

		return handleFederated(value);
	});

	const onCreate = useCallback(async () => {
		const goToRoom = (rid: string): void => {
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
				federated,
				...(teamId && { teamId }),
			},
		};

		if (type) {
			const roomData = await createPrivateChannel(params);
			console.log(roomData);
			!teamId && goToRoom(roomData.group._id as string);
		} else {
			const roomData = await createChannel(params);
			console.log(roomData);
			!teamId && goToRoom((roomData as any).channel._id);
		}

		onClose();
		reload();
	}, [
		name,
		users,
		readOnly,
		description,
		broadcast,
		encrypted,
		federated,
		teamId,
		type,
		onClose,
		reload,
		createPrivateChannel,
		createChannel,
	]);

	return (
		<CreateChannel
			values={values as CreateChannelProps['values']}
			handlers={handlers as ComponentProps<typeof CreateChannel>['handlers']}
			hasUnsavedChanges={hasUnsavedChanges}
			onChangeType={onChangeType}
			onChangeFederated={onChangeFederated}
			onChangeBroadcast={onChangeBroadcast}
			canOnlyCreateOneType={canOnlyCreateOneType}
			e2eEnabledForPrivateByDefault={Boolean(e2eEnabledForPrivateByDefault)}
			onClose={onClose}
			onCreate={onCreate}
		/>
	);
};

export default memo(CreateChannelWithData);
