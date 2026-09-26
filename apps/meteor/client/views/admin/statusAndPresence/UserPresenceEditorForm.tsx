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
	Icon,
	IconButton,
	TextInput,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { ContextualbarFooter, ContextualbarScrollableContent, UserAutoComplete } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import UserPresenceConfirmModal from './UserPresenceConfirmModal';
import { useApplyUserPresenceRules } from './useApplyUserPresenceRules';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { hasAdminStatusRules } from './useManagedPresenceUsers';
import { useResetUserPresenceRules } from './useResetUserPresenceRules';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useFormSubmitWithDirtyCheck } from '../../../hooks/useFormSubmitWithDirtyCheck';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';

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
	const applyRules = useApplyUserPresenceRules();
	const resetRules = useResetUserPresenceRules();

	const getUserInfo = useEndpoint('GET', '/v1/users.info');

	const {
		control,
		handleSubmit,
		watch,
		formState: { isSubmitting, isDirty, errors, dirtyFields },
	} = useForm<UserPresenceEditorFormValues>({ defaultValues });

	const presenceEnabled = watch('presenceEnabled');
	const targetUsername = watch('username');

	const resolveTarget = useStableCallback(async (username: string) => {
		if (userId) {
			return { _id: userId, replacesExistingRule: false };
		}

		try {
			const { user: found } = await getUserInfo({ username });

			return { _id: found._id, replacesExistingRule: hasAdminStatusRules(found) };
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });

			return undefined;
		}
	});

	const handleSave = useStableCallback(async ({ username, presenceEnabled, hiddenFrom, statusText }: UserPresenceEditorFormValues) => {
		const target = await resolveTarget(username);

		if (!target) {
			return;
		}

		const apply = async () => {
			const applied = await applyRules(
				target._id,
				{ presenceEnabled, hiddenFrom, statusText: dirtyFields.statusText ? statusText : undefined },
				t('Status_settings_updated', { name: username }),
			);

			if (applied) {
				onClose();
			}

			return applied;
		};

		if (target.replacesExistingRule) {
			setModal(
				<UserPresenceConfirmModal
					title={t('Replace_user_status_settings')}
					description={
						<Trans
							i18nKey='Replace_user_status_settings_description'
							values={{ name: username }}
							components={{ bold: <Box is='span' fontWeight='bold' /> }}
						/>
					}
					confirmText={t('Replace')}
					onConfirm={apply}
					onClose={() => setModal(null)}
				/>,
			);
			return;
		}

		await apply();
	});

	const submit = useFormSubmitWithDirtyCheck(handleSave, { isDirty });

	const hasRules = hasAdminStatusRules(user);

	const handleResetClick = useStableCallback(() => user && resetRules(user, onClose));

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
										<TextInput id={usernameFieldId} value={value} disabled startAddon={<UserAvatar size='x20' username={value} />} />
									) : (
										<UserAutoComplete
											id={usernameFieldId}
											value={value}
											onChange={onChange}
											error={Boolean(errors.username)}
											aria-invalid={errors.username ? 'true' : 'false'}
											aria-describedby={`${usernameFieldId}-error`}
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
						<FieldHint id={`${presenceFieldId}-hint`}>{t('User_status_admin_hint')}</FieldHint>
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
										aria-describedby={`${statusTextFieldId}-error ${statusTextFieldId}-hint`}
									/>
								)}
							/>
						</FieldRow>
						{errors.statusText && (
							<FieldError aria-live='assertive' id={`${statusTextFieldId}-error`}>
								{errors.statusText.message}
							</FieldError>
						)}
						<FieldHint id={`${statusTextFieldId}-hint`}>{t('StatusMessage_admin_hint')}</FieldHint>
					</Field>
					<Field>
						<FieldLabel htmlFor={hiddenFromFieldId}>{t('Hide_status_from')}</FieldLabel>
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
						<FieldHint id={`${hiddenFromFieldId}-hint`}>{t('Hide_status_from_hint')}</FieldHint>
					</Field>
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' variant='primary' loading={isSubmitting}>
						{t('Save')}
					</Button>
					{hasRules && (
						<IconButton
							icon={<Icon name='undo' size='x16' />}
							secondary
							flexGrow={0}
							title={t('Remove_user_status_settings')}
							onClick={handleResetClick}
						/>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default UserPresenceEditorForm;
