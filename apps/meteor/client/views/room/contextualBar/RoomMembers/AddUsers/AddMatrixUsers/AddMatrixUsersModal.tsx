import { Modal, Button, Box, Icon } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AddMatrixUsersModalProps = {
	matrixIdVerifiedStatus: Map<string, string>;
	completeUserList: string[];
	onClose: () => void;
	onSave: (args_0: any) => Promise<void>;
};

type FormValues = {
	usersToInvite: string[];
};

const verificationStatusAsIcon = (verificationStatus: string) => {
	if (verificationStatus === 'VERIFIED') {
		return 'circle-check';
	}

	if (verificationStatus === 'UNVERIFIED') {
		return 'circle-cross';
	}

	if (verificationStatus === 'UNABLE_TO_VERIFY') {
		return 'circle-exclamation';
	}
};

const AddMatrixUsersModal = ({ onClose, matrixIdVerifiedStatus, onSave, completeUserList }: AddMatrixUsersModalProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const usersToInvite = completeUserList.filter(
		(user) => !(matrixIdVerifiedStatus.has(user) && matrixIdVerifiedStatus.get(user) === 'UNVERIFIED'),
	);
	const rocketChatUsers = usersToInvite.filter((user) => !matrixIdVerifiedStatus.has(user));

	const { handleSubmit } = useForm<FormValues>({
		defaultValues: {
			usersToInvite,
		},
	});

	const onSubmit = (data: FormValues) => {
		onSave({ users: data.usersToInvite })
			.then(onClose)
			.catch((error) => dispatchToastMessage({ type: 'error', message: error as Error }));
	};

	const { t } = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>{t('Continue_Adding')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>
					<Box is='ul'>
						{[...matrixIdVerifiedStatus.entries()].map(([_matrixId, _verificationStatus]) => (
							<li key={_matrixId}>
								{_matrixId}: <Icon name={verificationStatusAsIcon(_verificationStatus) as ComponentProps<typeof Icon>['name']} size='x20' />
							</li>
						))}
						{rocketChatUsers.map((_user) => (
							<li key={`rocket-chat-${_user}`}>{_user}</li>
						))}
					</Box>
				</Box>
			</Modal.Content>
			<Modal.Footer justifyContent='center'>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleSubmit(onSubmit)} disabled={!(usersToInvite.length > 0)}>
						{t('Yes_continue')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AddMatrixUsersModal;
