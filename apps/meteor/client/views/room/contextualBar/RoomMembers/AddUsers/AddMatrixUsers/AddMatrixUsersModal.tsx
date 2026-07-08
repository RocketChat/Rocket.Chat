import {
	Modal,
	Button,
	Box,
	Icon,
	Label,
	CheckBox,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AddMatrixUsersModalProps = {
	matrixIdVerifiedStatus: Map<string, string>;
	completeUserList: string[];
	onClose: () => void;
	onSave: (args_0: { users: string[]; unbanConfirmed?: boolean }) => Promise<void>;
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

const AddMatrixUsersModal = ({ onClose, matrixIdVerifiedStatus, onSave, completeUserList }: AddMatrixUsersModalProps) => {
	const { t } = useTranslation();
	const checkboxId = useId();
	const [bannedError, setBannedError] = useState(false);
	const [unbanConfirmed, setUnbanConfirmed] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>();

	const usersToInvite = completeUserList.filter(
		(user) => !(matrixIdVerifiedStatus.has(user) && matrixIdVerifiedStatus.get(user) === 'UNVERIFIED'),
	);
	const rocketChatUsers = usersToInvite.filter((user) => !matrixIdVerifiedStatus.has(user));

	const { handleSubmit } = useForm<FormValues>({
		defaultValues: {
			usersToInvite,
		},
	});

	const onSubmit = async (data: FormValues) => {
		setLoading(true);
		setError(undefined);
		try {
			await onSave({ users: data.usersToInvite, unbanConfirmed });
			onClose();
		} catch (err: any) {
			if (err?.error === 'error-user-is-banned') {
				setBannedError(true);
				setUnbanConfirmed(false);
			} else {
				setError(err?.message || t('Something_went_wrong'));
			}
		} finally {
			setLoading(false);
		}
	};

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
				{bannedError && (
					<Box color='danger' fontScale='c1' mbs={8}>
						{t('User_is_banned_from_room_confirm_unban')}
					</Box>
				)}
				{error && (
					<Box color='danger' fontScale='c1' mbs={8}>
						{error}
					</Box>
				)}
			</ModalContent>
			<ModalFooter justifyContent={bannedError ? 'space-between' : 'flex-end'}>
				{bannedError && (
					<ModalFooterAnnotation>
						<Box display='flex' alignItems='center'>
							<CheckBox checked={unbanConfirmed} onChange={() => setUnbanConfirmed((prev) => !prev)} id={checkboxId} />
							<Label htmlFor={checkboxId} mis={8}>
								{t('Yes_unban_user')}
							</Label>
						</Box>
					</ModalFooterAnnotation>
				)}
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button
						primary
						onClick={handleSubmit(onSubmit)}
						disabled={!(usersToInvite.length > 0) || (bannedError && !unbanConfirmed)}
						loading={loading}
					>
						{t('Yes_continue')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AddMatrixUsersModal;
