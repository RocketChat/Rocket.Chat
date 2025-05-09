import { Button, Modal, Select, Field, FieldGroup, FieldLabel, FieldRow, Box } from '@rocket.chat/fuselage';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AssignExtensionModalProps = {
	onClose: () => void;
	defaultExtension?: string;
	defaultUsername?: string;
};

type FormValue = {
	username: string;
	extension: string;
};

const AssignExtensionModal = ({ defaultExtension, defaultUsername, onClose }: AssignExtensionModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const loggedUser = useUser();

	const assignUser = useEndpoint('POST', '/v1/voip-freeswitch.extension.assign');
	const getAvailableExtensions = useEndpoint('GET', '/v1/voip-freeswitch.extension.list');

	const modalTitleId = useId();
	const usersWithoutExtensionsId = useId();
	const freeExtensionNumberId = useId();

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<FormValue>({
		defaultValues: {
			username: defaultUsername,
			extension: defaultExtension,
		},
	});

	const selectedUsername = useWatch({ control, name: 'username' });
	const selectedExtension = useWatch({ control, name: 'extension' });

	const { data: availableExtensions = [], isLoading } = useQuery({
		queryKey: ['/v1/voip-freeswitch.extension.list', selectedUsername],
		queryFn: () => getAvailableExtensions({ type: 'available' as const, username: selectedUsername }),
		select: (data) => data.extensions || [],
		enabled: !!selectedUsername,
	});

	const extensionOptions = useMemo<[string, string][]>(
		() => availableExtensions.map(({ extension }) => [extension, extension]),
		[availableExtensions],
	);

	const handleAssignment = useMutation({
		mutationFn: async ({ username, extension }: FormValue) => {
			await assignUser({ username, extension });

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
		<Modal
			aria-labelledby={modalTitleId}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit((data) => handleAssignment.mutateAsync(data))} {...props} />}
		>
			<Modal.Header>
				<Modal.Title id={modalTitleId}>{t('Assign_extension')}</Modal.Title>
				<Modal.Close aria-label={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={usersWithoutExtensionsId}>{t('User')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								render={({ field }) => (
									<UserAutoComplete
										id={usersWithoutExtensionsId}
										value={field.value}
										onChange={field.onChange}
										conditions={{
											$or: [
												{ freeSwitchExtension: { $exists: true, $eq: selectedExtension } },
												{ freeSwitchExtension: { $exists: false } },
												{ username: { $exists: true, $eq: selectedUsername } },
											],
										}}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					<Field>
						<FieldLabel htmlFor={freeExtensionNumberId}>{t('Available_extensions')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='extension'
								render={({ field }) => (
									<Select
										id={freeExtensionNumberId}
										disabled={isLoading || !selectedUsername}
										options={extensionOptions}
										placeholder={t('Select_an_option')}
										value={field.value}
										onChange={field.onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary disabled={!selectedUsername || !selectedExtension} loading={isSubmitting} type='submit'>
						{t('Associate')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AssignExtensionModal;
