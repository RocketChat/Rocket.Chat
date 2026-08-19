import { Box } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';

export type EditStatusVisibilityModalProps = {
	onClose: () => void;
};

type StatusVisibilityFormValues = {
	statusVisibilityDenied: string[];
};

export const EditStatusVisibilityModal = ({ onClose }: EditStatusVisibilityModalProps) => {
	const { t } = useTranslation();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();
	const setPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const {
		control,
		handleSubmit,
		formState: { isDirty, isSubmitting },
	} = useForm<StatusVisibilityFormValues>({
		defaultValues: {
			statusVisibilityDenied: user?.settings?.preferences?.statusVisibilityDenied ?? [],
		},
	});

	const handleSave = async ({ statusVisibilityDenied }: StatusVisibilityFormValues) => {
		try {
			await setPreferences({ data: { statusVisibilityDenied } });
			dispatchToastMessage({ type: 'success', message: t('Accounts_StatusVisibility_Saved') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title={t('Accounts_StatusVisibility_HideStatus')}
			onCancel={onClose}
			confirmText={t('Save')}
			confirmDisabled={!isDirty || isSubmitting}
			wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit(handleSave)} {...props} />}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Accounts_StatusVisibility_HideFromUsers')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='statusVisibilityDenied'
							render={({ field: { onChange, value } }) => (
								<UserAutoCompleteMultiple
									value={value}
									onChange={onChange}
									exceptions={user?.username ? [user.username] : undefined}
									placeholder={t('Select_users')}
								/>
							)}
						/>
					</FieldRow>
					<FieldHint>{t('Accounts_StatusVisibility_HideFromUsers_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default EditStatusVisibilityModal;
