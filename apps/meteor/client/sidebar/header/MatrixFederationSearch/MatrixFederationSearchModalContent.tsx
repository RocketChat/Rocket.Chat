import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { VFC, FormEvent } from 'react';
import React, { useCallback, useState, useMemo } from 'react';

import FederatedRoomList from './FederatedRoomList';
import MatrixFederationAddServerModal from './MatrixFederationAddServerModal';
import MatrixFederationSearch from './MatrixFederationSearch';

type MatrixFederationSearchModalContentProps = {
	servers: Array<{
		name: string;
		default: boolean;
		local: boolean;
	}>;
};

const MatrixFederationSearchModalContent: VFC<MatrixFederationSearchModalContentProps> = ({ servers }) => {
	const [serverName, setServerName] = useState(servers[0].name);
	const [roomName, setRoomName] = useState('');

	const setModal = useSetModal();

	const debouncedRoomName = useDebouncedValue(roomName, 400);

	const t = useTranslation();

	const serverOptions = useMemo<Array<SelectOption>>(
		() => servers.map((server): SelectOption => [server.name, server.name]).concat([['addServer', t('Add_server')]]),
		[servers, t],
	);

	const handleSelectServer = useCallback(
		(value) => {
			if (value === 'addServer') {
				setModal(
					<MatrixFederationAddServerModal onClickClose={() => setModal(<MatrixFederationSearch onClose={() => setModal(null)} />)} />,
				);
				return;
			}
			setServerName(value);
		},
		[setModal],
	);

	return (
		<>
			<Box display='flex' flexDirection='row' mbe='x16'>
				<Select mie='x4' flexGrow={0} flexShrink={4} options={serverOptions} value={serverName} onChange={handleSelectServer} />
				<TextInput
					placeholder={t('Search_rooms')}
					flexGrow={4}
					flexShrink={0}
					value={roomName}
					onChange={(e: FormEvent<HTMLInputElement>) => setRoomName(e.currentTarget.value)}
				/>
			</Box>
			<Box h='full'>
				<FederatedRoomList serverName={serverName} roomName={debouncedRoomName} />
			</Box>
		</>
	);
};

export default MatrixFederationSearchModalContent;
