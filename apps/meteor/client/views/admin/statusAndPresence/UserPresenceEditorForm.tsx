import {
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
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { ContextualbarFooter, ContextualbarScrollableContent, UserAutoComplete } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserPresenceConfirmModal from './UserPresenceConfirmModal';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { useFindManagedUser } from './useManagedPresenceUsers';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useFormSubmitWithDirtyCheck } from '../../../hooks/useFormSubmitWithDirtyCheck';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';
import { managedPresenceQueryKeys } from '../../../lib/queryKeys';

type UserPresenceEditorFormValues = {
	username: string;
	presenceEnabled: boolean;
	statusText: string;
	hiddenFrom: string[];
};

export type UserPresenceEditorFormProps = {
	user?: ManagedPresenceUser;
	defaultUsername?: string;
	onClose: () => void;
};

const UserPresenceEditorForm = ({ user, defaultUsername, onClose }: UserPresenceEditorFormProps) => {
	const { t } = useTranslation();
	const userId = user?._id;
	const defaultValues: UserPresenceEditorFormValues = {
		username: defaultUsername ?? '',
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
	const findManagedUser = useFindManagedUser();

	const {
		control,
		handleSubmit,
		watch,
		formState: { isSubmitting, isDirty, errors, dirtyFields },
	} = useForm<UserPresenceEditorFormValues>({ defaultValues });

	const presenceEnabled = watch('presenceEnabled');
	const targetUsername = watch('username');

	const applyPresence = useStableCallback(
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

				queryClient.invalidateQueries({ queryKey: managedPresenceQueryKeys.all });
				dispatchToastMessage({ type: 'success', message });
				onClose();

				return true;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });

				return false;
			}
		},
	);

	const confirm = useStableCallback(
		(title: string, description: string, confirmText: string, onConfirm: () => Promise<boolean>, variant?: 'danger') => {
			setModal(
				<UserPresenceConfirmModal
					title={title}
					description={description}
					confirmText={confirmText}
					variant={variant}
					onConfirm={onConfirm}
					onClose={() => setModal(null)}
				/>,
			);
		},
	);

	const handleSave = useStableCallback(async ({ username, presenceEnabled, hiddenFrom, statusText }: UserPresenceEditorFormValues) => {
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
				const managed = await findManagedUser(username);

				replacesExistingRule = Boolean(managed);
				targetUserId = managed?._id ?? (await getUserInfo({ username })).user._id;
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

		await apply();
	});

	const submit = useFormSubmitWithDirtyCheck(handleSave, { isDirty });

	const handleRemoveClick = useStableCallback(() => {
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
	});

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(submit)} id={formId}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={usernameFieldId}>{t('User')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='username'
								rules={{ required: t('Required_field', { field: t('User') }) }}
								render={({ field: { value, onChange } }) =>
									defaultUsername ? (
										<TextInput
											id={usernameFieldId}
											value={value}
											disabled
											startAddon={<UserAvatar size='x20' username={value} />}
											aria-describedby={`${usernameFieldId}-hint`}
										/>
									) : (
										<UserAutoComplete
											id={usernameFieldId}
											value={value}
											onChange={onChange}
											error={Boolean(errors.username)}
											aria-invalid={errors.username ? 'true' : 'false'}
											aria-describedby={`${usernameFieldId}-error ${usernameFieldId}-hint`}
											placeholder={t('Select_user')}
										/>
									)
								}
							/>
						</FieldRow>
						{errors.username && (
							<FieldError aria-live='assertive' id={`${usernameFieldId}-error`}>
								{errors.username.message}
							</FieldError>
						)}
						<FieldHint id={`${usernameFieldId}-hint`}>{t('User_has_no_visibility_into_changes_made_in_this_panel')}</FieldHint>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={presenceFieldId}>{t('Show_status')}</FieldLabel>
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
						<FieldHint id={`${presenceFieldId}-hint`}>{t('User_presence_admin_hint')}</FieldHint>
					</Field>
					<Field>
						<FieldLabel htmlFor={statusTextFieldId}>{t('StatusMessage')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='statusText'
								rules={{
									maxLength: { value: USER_STATUS_TEXT_MAX_LENGTH, message: t('Max_length_is', { limit: USER_STATUS_TEXT_MAX_LENGTH }) },
								}}
								render={({ field: { value, onChange } }) => (
									<TextInput
										id={statusTextFieldId}
										value={value}
										onChange={onChange}
										disabled={!presenceEnabled}
										error={errors.statusText?.message}
										aria-invalid={errors.statusText ? 'true' : 'false'}
										aria-describedby={`${statusTextFieldId}-error`}
									/>
								)}
							/>
						</FieldRow>
						{errors.statusText && (
							<FieldError aria-live='assertive' id={`${statusTextFieldId}-error`}>
								{errors.statusText.message}
							</FieldError>
						)}
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
										exceptions={targetUsername ? [targetUsername] : undefined}
										aria-describedby={`${hiddenFromFieldId}-hint`}
										placeholder={t('Select_users')}
									/>
								)}
							/>
						</FieldRow>
						<FieldHint id={`${hiddenFromFieldId}-hint`}>{t('Hide_presence_from_hint')}</FieldHint>
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' primary loading={isSubmitting}>
						{t('Save')}
					</Button>
					{userId && <IconButton icon='trash' small title={t('Remove_user_presence_settings')} onClick={handleRemoveClick} />}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserPresenceEditorForm;
