import { Box, Modal, ButtonGroup, Button, Field, TextInput } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { VFC, FormEvent } from 'react';
import React, { useState } from 'react';

import MatrixFederationSearch from './MatrixFederationSearch';

type MatrixFederationAddServerModalProps = {
	onClickClose: () => void;
};

const MatrixFederationAddServerModal: VFC<MatrixFederationAddServerModalProps> = ({ onClickClose }) => {
	const t = useTranslation();
	const addMatrixServer = useEndpoint('POST', '/v1/federation/addServerByUser');
	const [serverName, setServerName] = useState('');
	const setModal = useSetModal();

	const { mutate: addServer, isLoading } = useMutation(
		['v1/federation/addServerByUser', serverName],
		() => addMatrixServer({ serverName }),
		{
			onSuccess: () => {
				setModal(<MatrixFederationSearch onClose={onClickClose} />);
			},
		},
	);

	return (
		<Modal maxHeight={'x600'}>
			<Modal.Header>
				<Modal.Title>{t('Add_new_federated_server')}</Modal.Title>
				<Modal.Close onClick={onClickClose} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<Field.Label>{t('Server_name')}</Field.Label>
					<Field.Row>
						<TextInput value={serverName} onChange={(e: FormEvent<HTMLInputElement>) => setServerName(e.currentTarget.value)} />
					</Field.Row>
					<Field.Hint>{t('Federation_Example_matrix_server')}</Field.Hint>
				</Field>
			</Modal.Content>
			<Modal.Footer justifyContent='space-between' alignItems='center'>
				<Box is='span' fontScale='c1' color='annotation'>
					{t('This_server_will_be_available_while_your_session_is_active')}
				</Box>
				<ButtonGroup>
					<Button onClick={onClickClose}>{t('Cancel')}</Button>
					<Button onClick={() => addServer()} primary disabled={isLoading}>
						{t('Add')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default MatrixFederationAddServerModal;
