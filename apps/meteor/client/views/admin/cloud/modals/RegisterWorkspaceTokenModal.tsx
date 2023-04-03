import { Box, Button, ButtonGroup, Field, Modal, TextInput } from '@rocket.chat/fuselage';
import { useMethod, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import WorkspaceRegistrationModal from './RegisterWorkspaceModal';

type RegisterWorkspaceTokenModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisterWorkspaceTokenModal = ({ onClose, onStatusChange, ...props }: RegisterWorkspaceTokenModalProps) => {
	const setModal = useSetModal();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const connectWorkspace = useMethod('cloud:connectWorkspace');

	const [token, setToken] = useState('');
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState(false);

	const handleBackAction = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	const handleTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
		setToken(event.target.value);
	};

	const isToken = token.length > 0;

	const handleConnectButtonClick = async (): Promise<void> => {
		setProcessing(true);
		setError(false);

		try {
			const isConnected = await connectWorkspace(token);

			if (!isConnected) {
				throw Error(t('RegisterWorkspace_Connection_Error'));
			}

			setModal(null);

			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setError(true);
		} finally {
			await (onStatusChange && onStatusChange());
			setProcessing(false);
		}
	};

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('RegisterWorkspace_Token_Title')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='p'>
					<Trans i18nKey='RegisterWorkspace_Token_Step_One'>
						1. Go to:{' '}
						<Box is='span' fontWeight={600}>
							cloud.rocket.chat {'>'} Workspaces
						</Box>{' '}
						and click{' '}
						<Box is='span' fontWeight={600}>
							"Register self-managed"
						</Box>
						.
					</Trans>
				</Box>
				<Box is='p' fontSize='p2'>{`2. ${t('RegisterWorkspace_Token_Step_Two')}`}</Box>
				<Field pbs={10}>
					<Field.Label>{t('Registration_Token')}</Field.Label>
					<Field.Row>
						<TextInput onChange={handleTokenChange} value={token} />
					</Field.Row>
					{error && <Field.Error>{t('Token_Not_Recognized')}</Field.Error>}
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={handleBackAction}>{t('Back')}</Button>
					<Button primary disabled={processing || !isToken} onClick={handleConnectButtonClick}>
						{t('Next')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default RegisterWorkspaceTokenModal;
