import { UserStatus as UserStatusType } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBox, Margins, Box } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint, TextInput, Select } from '@rocket.chat/fuselage-forms';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useSetting, useEndpoint, useUser, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ComponentProps } from 'react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import UserStatusMenu from '../../../components/UserStatusMenu';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';
import { getUserStatusInitialValues } from '../../../lib/getUserInitialStatus';
import { STATUS_DURATION_OPTIONS, validateStatusExpiration } from '../../../lib/statusDurations';

type EditStatusModalProps = {
	onClose: () => void;
};

type StatusFormValues = {
	statusText: string;
	statusType: UserStatusType;
	statusDuration: string;
	statusCustomDate: string;
	statusCustomTime: string;
};

const EditStatusModal = ({ onClose }: EditStatusModalProps) => {
	const t = useTranslation();
	const user = useUser();
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const dispatchToastMessage = useToastMessageDispatch();
	const [customStatus, setCustomStatus] = useLocalStorage<string>('Local_Custom_Status', '');

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<StatusFormValues>({
		defaultValues: getUserStatusInitialValues(user, customStatus),
	});

	const { statusDuration, statusType, statusText } = watch();
	const isExpirationDisabled = statusType === UserStatusType.ONLINE && !statusText.trim();

	useEffect(() => {
		if (isExpirationDisabled) {
			setValue('statusDuration', '', { shouldValidate: true });
		}
	}, [isExpirationDisabled, setValue]);

	const isStatusFromCall = user?.statusSource === 'internal' || user?.statusSource === 'external';

	const setUserStatus = useEndpoint('POST', '/v1/users.setStatus');

	const durationOptions: SelectOption[] = useMemo(() => STATUS_DURATION_OPTIONS.map(({ value, labelKey }) => [value, t(labelKey)]), [t]);

	const handleSaveStatus = async ({
		statusText,
		statusType,
		statusDuration,
		statusCustomDate,
		statusCustomTime,
	}: StatusFormValues): Promise<void> => {
		const expiresAt = STATUS_DURATION_OPTIONS.find((o) => o.value === statusDuration)?.getExpiresAt?.({
			now: new Date(),
			customDate: statusCustomDate,
			customTime: statusCustomTime,
		});
		try {
			await setUserStatus({
				message: statusText,
				status: statusType,
				...(expiresAt && { expiresAt: expiresAt.toISOString() }),
			});
			setCustomStatus(statusText);
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title={t('Status_set_your_status')}
			onCancel={onClose}
			confirmText={t('Save')}
			confirmDisabled={!isDirty}
			wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit(handleSaveStatus)} {...props} />}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Status')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='statusText'
							rules={{
								maxLength: {
									value: USER_STATUS_TEXT_MAX_LENGTH,
									message: t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH),
								},
							}}
							render={({ field }) => (
								<TextInput
									{...field}
									error={errors.statusText?.message}
									disabled={!allowUserStatusMessageChange}
									flexGrow={1}
									placeholder={t(statusType)}
									startAddon={
										<Controller
											control={control}
											name='statusType'
											render={({ field: { value, onChange } }) => <UserStatusMenu initialStatus={value} onChange={onChange} />}
										/>
									}
								/>
							)}
						/>
					</FieldRow>
					<FieldHint>{t(allowUserStatusMessageChange ? 'Status_you_can_use_emoji' : 'StatusMessage_Change_Disabled')}</FieldHint>
					{errors.statusText && <FieldError>{errors.statusText.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Status_clear_after')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='statusDuration'
							rules={{
								deps: ['statusCustomDate', 'statusCustomTime'],
								validate: (value, { statusCustomDate, statusCustomTime }) =>
									validateStatusExpiration(value, { statusCustomDate, statusCustomTime }, t),
							}}
							render={({ field: { value, onChange } }) => (
								<Select
									value={value}
									options={durationOptions}
									onChange={(next) => onChange(String(next))}
									disabled={isExpirationDisabled}
								/>
							)}
						/>
					</FieldRow>
					{statusDuration === 'custom' && (
						<Box display='flex' mi='neg-x4' mbs={8}>
							<Margins inline={4}>
								<Controller
									control={control}
									name='statusCustomDate'
									render={({ field: { value, onChange } }) => (
										<InputBox
											aria-label={t('Status_expiration_date')}
											type='date'
											flexGrow={1}
											value={value}
											onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
											min={new Date().toLocaleDateString('en-CA')}
										/>
									)}
								/>
								<Controller
									control={control}
									name='statusCustomTime'
									render={({ field: { value, onChange } }) => (
										<InputBox
											aria-label={t('Status_expiration_time')}
											type='time'
											flexGrow={1}
											value={value}
											onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
										/>
									)}
								/>
							</Margins>
						</Box>
					)}
					{errors.statusDuration && <FieldError>{errors.statusDuration.message}</FieldError>}
					<FieldHint>{t(isStatusFromCall ? 'Status_new_status_warning_after_call' : 'Status_new_status_warning')}</FieldHint>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default EditStatusModal;
