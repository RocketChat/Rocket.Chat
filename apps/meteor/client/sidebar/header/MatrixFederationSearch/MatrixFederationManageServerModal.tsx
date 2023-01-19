import { Divider, Modal, ButtonGroup, Button, Field, TextInput } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VFC, FormEvent } from 'react';
import React, { useState } from 'react';

import MatrixFederationRemoveServerList from './MatrixFederationRemoveServerList';
import MatrixFederationSearch from './MatrixFederationSearch';
import { useMatrixServerList } from './useMatrixServerList';

type MatrixFederationAddServerModalProps = {
	onClickClose: () => void;
};

// const addMatrixServer = ({ serverName }) =>
// 	new Promise((resolve) =>
// 		resolve({
// 			success: true,
// 		}),
// 	);

const MatrixFederationAddServerModal: VFC<MatrixFederationAddServerModalProps> = ({ onClickClose }) => {
	const t = useTranslation();
	const addMatrixServer = useEndpoint('POST', '/v1/federation/addServerByUser');
	const [serverName, setServerName] = useState('');
	const setModal = useSetModal();
	const queryClient = useQueryClient();

	const {
		mutate: addServer,
		isLoading,
		isError,
	} = useMutation(['v1/federation/addServerByUser', serverName], () => addMatrixServer({ serverName }), {
		onSuccess: () => {
			queryClient.invalidateQueries(['federation/listServersByUsers']);
			setModal(<MatrixFederationSearch defaultSelectedServer={serverName} onClose={onClickClose} key={serverName} />);
		},
	});

	const { data, isLoading: isLoadingServerList } = useMatrixServerList();

	return (
		<Modal maxHeight={'x600'}>
			<Modal.Header>
				<Modal.Title>{t('Manage_servers')}</Modal.Title>
				<Modal.Close onClick={onClickClose} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<Field.Label>{t('Server_name')}</Field.Label>
					<Field.Row>
						<TextInput value={serverName} onChange={(e: FormEvent<HTMLInputElement>) => setServerName(e.currentTarget.value)} mie='x4' />
						<Button onClick={() => addServer()} primary disabled={isLoading}>
							{t('Add')}
						</Button>
					</Field.Row>
					{isError && <Field.Error>{t('Server_doesnt_exist')}</Field.Error>}
					<Field.Hint>{t('Federation_Example_matrix_server')}</Field.Hint>
				</Field>
				<Divider mb='x16' />
				{!isLoadingServerList && data?.servers && <MatrixFederationRemoveServerList servers={data.servers} />}
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup>
					<Button onClick={onClickClose}>{t('Cancel')}</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default MatrixFederationAddServerModal;
