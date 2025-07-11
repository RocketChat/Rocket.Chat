import {
	Button,
	Modal,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	TextInput,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type RemoveExtensionModalProps = {
	name: string;
	extension: string;
	username: string;
	onClose: () => void;
};

const RemoveExtensionModal = ({ name, extension, username, onClose }: RemoveExtensionModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const loggedUser = useUser();

	const removeExtension = useEndpoint('POST', '/v1/voip-freeswitch.extension.assign');

	const modalTitleId = useId();
	const userFieldId = useId();
	const freeExtensionNumberId = useId();

	const handleRemoveExtension = useMutation({
		mutationFn: (username: string) => removeExtension({ username }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Extension_removed') });

			queryClient.invalidateQueries({
				queryKey: ['users.list'],
			});
			if (loggedUser?.username === username) {
				queryClient.invalidateQueries({
					queryKey: ['voip-client'],
				});
			}

			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
			onClose();
		},
	});

	return (
		<Modal aria-labelledby={modalTitleId}>
			<ModalHeader>
				<ModalTitle id={modalTitleId}>{t('Remove_extension')}</ModalTitle>
				<ModalClose aria-label={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={userFieldId}>{t('User')}</FieldLabel>
						<FieldRow>
							<TextInput disabled id={userFieldId} value={name} />
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel htmlFor={freeExtensionNumberId}>{t('Extension')}</FieldLabel>
						<FieldRow>
							<TextInput disabled id={freeExtensionNumberId} value={extension} />
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button danger onClick={() => handleRemoveExtension.mutate(username)} loading={handleRemoveExtension.isPending}>
						{t('Remove')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default RemoveExtensionModal;
