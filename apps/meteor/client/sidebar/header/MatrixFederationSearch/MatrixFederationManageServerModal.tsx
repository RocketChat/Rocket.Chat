import { Divider, Modal, ButtonGroup, Button, Field, TextInput, Throbber } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VFC, FormEvent } from 'react';
import React, { useState } from 'react';

import MatrixFederationRemoveServerList from './MatrixFederationRemoveServerList';
import MatrixFederationSearch from './MatrixFederationSearch';
import { useMatrixServerList } from './useMatrixServerList';

type MatrixFederationAddServerModalProps = {
	onClickClose: () => void;
};

const getErrorKey = (error: any): TranslationKey | undefined => {
	if (!error) {
		return;
	}
	if (error.error === 'invalid-server-name') {
		return 'Server_doesnt_exist';
	}
	if (error.error === 'invalid-server-name') {
		return 'Server_already_added';
	}
};

const MatrixFederationAddServerModal: VFC<MatrixFederationAddServerModalProps> = ({ onClickClose }) => {
	const t = useTranslation();
	const addMatrixServer = useEndpoint('POST', '/v1/federation/addServerByUser');
	const [serverName, setServerName] = useState('');
	const [errorKey, setErrorKey] = useState<TranslationKey | undefined>();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		mutate: addServer,
		isLoading,
		isError,
	} = useMutation(['v1/federation/addServerByUser', serverName], () => addMatrixServer({ serverName }), {
		onSuccess: async () => {
			await queryClient.invalidateQueries(['federation/listServersByUsers']);
			setModal(<MatrixFederationSearch defaultSelectedServer={serverName} onClose={onClickClose} key={serverName} />);
		},
		onError: (error) => {
			const errorKey = getErrorKey(error);
			if (!errorKey) {
				dispatchToastMessage({ type: 'error', message: error });
				return;
			}
			setErrorKey(errorKey);
		},
	});

	const { data, isLoading: isLoadingServerList } = useMatrixServerList();

	return (
		<Modal maxHeight='x600'>
			<Modal.Header>
				<Modal.Title>{t('Manage_servers')}</Modal.Title>
				<Modal.Close onClick={onClickClose} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<Field.Label>{t('Server_name')}</Field.Label>
					<Field.Row>
						<TextInput
							disabled={isLoading}
							value={serverName}
							onChange={(e: FormEvent<HTMLInputElement>) => {
								setServerName(e.currentTarget.value);
								if (errorKey) {
									setErrorKey(undefined);
								}
							}}
							mie={4}
						/>
						<Button onClick={() => addServer()} primary disabled={isLoading}>
							{!isLoading && t('Add')}
							{isLoading && <Throbber inheritColor />}
						</Button>
					</Field.Row>
					{isError && errorKey && <Field.Error>{t(errorKey)}</Field.Error>}
					<Field.Hint>{t('Federation_Example_matrix_server')}</Field.Hint>
				</Field>
				<Divider mb={16} />
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
