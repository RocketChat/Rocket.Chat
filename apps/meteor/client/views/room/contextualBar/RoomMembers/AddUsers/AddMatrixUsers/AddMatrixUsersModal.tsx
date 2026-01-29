import {
	Modal,
	Button,
	Box,
	Icon,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
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

const verificationStatusAsIcon = (verificationStatus: string): ComponentProps<typeof Icon>['name'] => {
	if (verificationStatus === 'VERIFIED') {
		return 'circle-check';
	}

	if (verificationStatus === 'UNVERIFIED') {
		return 'circle-cross';
	}
	return 'circle-exclamation';
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
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Continue_Adding')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box is='ul'>
					{[...matrixIdVerifiedStatus.entries()].map(([_matrixId, _verificationStatus]) => (
						<Box is='li' display='flex' key={_matrixId}>
							{_matrixId} <Icon mis={4} name={verificationStatusAsIcon(_verificationStatus)} title={t(_verificationStatus)} size='x20' />
						</Box>
					))}
					{rocketChatUsers.map((_user) => (
						<Box is='li' key={`rocket-chat-${_user}`}>
							{_user}
						</Box>
					))}
				</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleSubmit(onSubmit)} disabled={!(usersToInvite.length > 0)}>
						{t('Yes_continue')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AddMatrixUsersModal;
