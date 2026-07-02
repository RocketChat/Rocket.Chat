import {
	Button,
	Modal,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	Field,
	FieldLabel,
	FieldRow,
	TextInput,
	ButtonGroup,
	Box,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { subscriptionsQueryKeys } from '../lib/queryKeys';

type NewFolderModalProps = {
	rid: string;
	onClose: () => void;
};

const NewFolderModal = ({ rid, onClose }: NewFolderModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const subscription = useUserSubscription(rid);
	const saveDmFolder = useEndpoint('POST', '/v1/subscriptions.saveDmFolder');

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm({
		defaultValues: {
			folderName: subscription?.dmFolder || '',
		},
	});

	useEffect(() => {
		reset({
			folderName: subscription?.dmFolder || '',
		});
	}, [subscription, reset]);

	const onSubmit = async (data: { folderName: string }) => {
		try {
			const folder = data.folderName.trim();
			if (!folder) {
				dispatchToastMessage({
					type: 'error',
					message: t('Folder_name_cannot_be_empty', 'Folder name cannot be empty'),
				});
				return;
			}
			await saveDmFolder({ roomId: rid, dmFolder: folder });

			// Update local cache
			queryClient.setQueryData(subscriptionsQueryKeys.subscription(rid), (sub: any) => (sub ? { ...sub, dmFolder: folder } : undefined));
			queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

			dispatchToastMessage({
				type: 'success',
				message: t('Folder_saved_successfully'),
			});
			onClose();
		} catch (error) {
			let message = t('Something_went_wrong', 'Something went wrong');
			if (error instanceof Error) {
				message = error.message;
			} else if (typeof error === 'string') {
				message = error;
			}
			dispatchToastMessage({ type: 'error', message });
		}
	};

	return (
		<Modal>
			<Box is='form' onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<ModalHeader>
					<ModalTitle>{t('New_Folder', 'New Folder')}</ModalTitle>
					<ModalClose onClick={onClose} />
				</ModalHeader>
				<ModalContent>
					<Field mbe={16}>
						<FieldLabel>{t('Folder_Name', 'Folder Name')}</FieldLabel>
						<FieldRow>
							<Controller
								name='folderName'
								control={control}
								render={({ field }) => (
									<TextInput {...field} placeholder={t('Enter_folder_name', 'Enter folder name')} addon={<Box is='span' color='hint' />} />
								)}
							/>
						</FieldRow>
					</Field>
				</ModalContent>
				<ModalFooter>
					<ButtonGroup align='end'>
						<Button onClick={onClose}>{t('Cancel')}</Button>
						<Button primary type='submit' disabled={isSubmitting}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Box>
		</Modal>
	);
};

export default NewFolderModal;
