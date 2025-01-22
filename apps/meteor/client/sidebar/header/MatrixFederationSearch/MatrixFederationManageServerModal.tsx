import { Divider, Modal, ButtonGroup, Button, Field, FieldLabel, FieldRow, FieldError, FieldHint, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useState } from 'react';

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

const MatrixFederationAddServerModal = ({ onClickClose }: MatrixFederationAddServerModalProps) => {
	const t = useTranslation();
	const addMatrixServer = useEndpoint('POST', '/v1/federation/addServerByUser');
	const [serverName, setServerName] = useState('');
	const [errorKey, setErrorKey] = useState<TranslationKey | undefined>();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		mutate: addServer,
		isPending,
		isError,
	} = useMutation({
		mutationKey: ['v1/federation/addServerByUser', serverName],
		mutationFn: () => addMatrixServer({ serverName }),

		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['federation/listServersByUsers'],
			});
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

	const { data, isPending: isLoadingServerList } = useMatrixServerList();

	const titleId = useUniqueId();
	const serverNameId = useUniqueId();

	return (
		<Modal maxHeight='x600' open aria-labelledby={titleId}>
			<Modal.Header>
				<Modal.Title id={titleId}>{t('Manage_servers')}</Modal.Title>
				<Modal.Close onClick={onClickClose} />
			</Modal.Header>
			<Modal.Content>
				<Field>
					<FieldLabel htmlFor={serverNameId}>{t('Server_name')}</FieldLabel>
					<FieldRow>
						<TextInput
							id={serverNameId}
							disabled={isPending}
							value={serverName}
							onChange={(e: FormEvent<HTMLInputElement>) => {
								setServerName(e.currentTarget.value);
								if (errorKey) {
									setErrorKey(undefined);
								}
							}}
							mie={4}
						/>
						<Button primary loading={isPending} onClick={() => addServer()}>
							{t('Add')}
						</Button>
					</FieldRow>
					{isError && errorKey && <FieldError>{t(errorKey)}</FieldError>}
					<FieldHint>{t('Federation_Example_matrix_server')}</FieldHint>
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
