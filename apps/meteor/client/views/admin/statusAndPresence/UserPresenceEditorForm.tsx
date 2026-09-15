import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldError,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	IconButton,
	TextInput,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { ContextualbarFooter, ContextualbarScrollableContent, GenericModal, UserAutoComplete } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useCallback, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';

type UserPresenceEditorFormValues = {
	username: string;
	presenceEnabled: boolean;
	statusText: string;
	hiddenFrom: string[];
};

type UserPresenceEditorFormProps = {
	user?: ManagedPresenceUser;
	onClose: () => void;
};

const UserPresenceEditorForm = ({ user, onClose }: UserPresenceEditorFormProps) => {
	const { t } = useTranslation();
	const userId = user?._id;
	const defaultValues: UserPresenceEditorFormValues = {
		username: user?.username ?? '',
		presenceEnabled: !user?.presenceDisabledByAdmin,
		statusText: user?.statusText ?? '',
		hiddenFrom: user?.statusVisibilityDeniedByAdmin ?? [],
	};
	const formId = useId();
	const usernameFieldId = useId();
	const presenceFieldId = useId();
	const statusTextFieldId = useId();
	const hiddenFromFieldId = useId();

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const updateUser = useEndpoint('POST', '/v1/users.update');

	const {
		control,
		handleSubmit,
		watch,
		formState: { isSubmitting, errors, dirtyFields },
	} = useForm<UserPresenceEditorFormValues>({ defaultValues, mode: 'all' });

	const presenceEnabled = watch('presenceEnabled');

	const invalidateManagedPresenceUsers = useCallback(
		() => queryClient.invalidateQueries({ queryKey: ['admin', 'managed-presence-users'] }),
		[queryClient],
	);

	const applyPresence = useCallback(
		async (
			{
				targetUserId,
				presenceEnabled,
				hiddenFrom,
				statusText,
			}: { targetUserId: string; presenceEnabled: boolean; hiddenFrom: string[]; statusText?: string },
			message: string,
		) => {
			try {
				await updateUser({
					userId: targetUserId,
					data: {
						presenceDisabledByAdmin: !presenceEnabled,
						statusVisibilityDeniedByAdmin: hiddenFrom,
						...(statusText !== undefined && { statusText }),
					},
				});

				invalidateManagedPresenceUsers();
				dispatchToastMessage({ type: 'success', message });
				onClose();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[updateUser, invalidateManagedPresenceUsers, dispatchToastMessage, onClose],
	);

	const confirm = useCallback(
		(title: string, description: string, confirmText: string, onConfirm: () => Promise<void>, variant?: 'danger') => {
			const handleCancel = (): void => setModal(null);

			setModal(
				<GenericModal
					variant={variant}
					title={title}
					confirmText={confirmText}
					onConfirm={async () => {
						await onConfirm();
						setModal(null);
					}}
					onCancel={handleCancel}
					onClose={handleCancel}
				>
					{description}
				</GenericModal>,
			);
		},
		[setModal],
	);

	const handleSave = useCallback(
		async ({ username, presenceEnabled, hiddenFrom, statusText }: UserPresenceEditorFormValues) => {
			if (userId && presenceEnabled && hiddenFrom.length === 0 && statusText === '') {
				confirm(t('Reset_user_status_settings'), t('Reset_user_status_settings_description', { name: username }), t('Reset'), () =>
					applyPresence(
						{ targetUserId: userId, presenceEnabled, hiddenFrom, statusText: '' },
						t('Status_settings_reset_to_workspace_default', { name: username }),
					),
				);
				return;
			}

			let targetUserId = userId;
			let replacesExistingRule = false;

			if (!targetUserId) {
				try {
					const { user: found } = await getUserInfo({ username });

					targetUserId = found._id;
					replacesExistingRule = found.presenceDisabledByAdmin === true || !!found.statusVisibilityDeniedByAdmin?.length;
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}
			}

			const resolvedId = targetUserId;

			if (!resolvedId) {
				return;
			}

			const apply = () =>
				applyPresence(
					{ targetUserId: resolvedId, presenceEnabled, hiddenFrom, statusText: dirtyFields.statusText ? statusText : undefined },
					t('Presence_settings_updated', { name: username }),
				);

			if (replacesExistingRule) {
				confirm(t('Replace_user_status_settings'), t('Replace_user_status_settings_description', { name: username }), t('Replace'), apply);
				return;
			}

			return apply();
		},
		[userId, getUserInfo, dispatchToastMessage, confirm, applyPresence, t, dirtyFields.statusText],
	);

	const handleRemoveClick = useCallback(() => {
		const username = user?.username ?? '';

		confirm(
			t('Remove_user_presence_settings'),
			t('Remove_user_presence_settings_description', { name: username }),
			t('Remove'),
			() =>
				applyPresence(
					{ targetUserId: userId ?? '', presenceEnabled: true, hiddenFrom: [], statusText: '' },
					t('Status_settings_removed', { name: username }),
				),
			'danger',
		);
	}, [userId, user?.username, confirm, applyPresence, t]);

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)} id={formId}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={usernameFieldId}>{t('User')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{ required: t('Required_field', { field: t('User') }) }}
								render={({ field: { value, onChange } }) => (
									<UserAutoComplete
										id={usernameFieldId}
										value={value}
										onChange={onChange}
										disabled={Boolean(userId)}
										placeholder={value ? undefined : t('Select_user')}
									/>
								)}
							/>
						</FieldRow>
						{errors.username && <FieldError>{errors.username.message}</FieldError>}
						<FieldHint>{t('User_has_no_visibility_into_changes_made_in_this_panel')}</FieldHint>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' flexGrow={1}>
							<FieldLabel htmlFor={presenceFieldId}>{t('Show_status')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='presenceEnabled'
									render={({ field: { value, onChange } }) => (
										<ToggleSwitch
											id={presenceFieldId}
											aria-describedby={`${presenceFieldId}-hint`}
											checked={value}
											onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked)}
										/>
									)}
								/>
							</FieldRow>
						</Box>
						<FieldHint id={`${presenceFieldId}-hint`}>{t('User_presence_admin_hint')}</FieldHint>
					</Field>
					<Field>
						<FieldLabel htmlFor={statusTextFieldId}>{t('StatusMessage')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='statusText'
								render={({ field: { value, onChange } }) => (
									<TextInput id={statusTextFieldId} value={value} onChange={onChange} disabled={!presenceEnabled} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={hiddenFromFieldId}>{t('Hide_presence_from')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='hiddenFrom'
								render={({ field: { value, onChange } }) => (
									<UserAutoCompleteMultiple
										id={hiddenFromFieldId}
										value={value}
										onChange={onChange}
										disabled={!presenceEnabled}
										placeholder={t('Select_users')}
									/>
								)}
							/>
						</FieldRow>
						<FieldHint>{t('Hide_presence_from_hint')}</FieldHint>
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' primary disabled={isSubmitting}>
						{t('Save')}
					</Button>
					{userId && <IconButton icon='trash' small title={t('Remove_user_presence_settings')} onClick={handleRemoveClick} />}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserPresenceEditorForm;
