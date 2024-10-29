import type { CustomFieldMetadata, ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Badge, Box, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useAtLeastOnePermission, useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { ContactManagerInput } from '../../additionalForms';
import { useCustomFieldsMetadata } from '../../directory/hooks/useCustomFieldsMetadata';

const fieldNameMap: { [key: string]: TranslationKey } = {
	name: 'Name',
	contactManager: 'Contact_Manager',
};

function mapConflicts(
	contact: Serialized<ILivechatContact>,
	metadata: CustomFieldMetadata[],
): Record<string, { name: string; label: string; values: string[] }> {
	const conflicts = contact.conflictingFields?.reduce(
		(acc, current) => {
			const fieldName = current.field === 'manager' ? 'contactManager' : current.field.replace('customFields.', '');

			if (acc[fieldName]) {
				acc[fieldName].values.push(current.value);
			} else {
				acc[fieldName] = {
					name: fieldName,
					label:
						(current.field.startsWith('customFields.') && metadata.find(({ name }) => name === fieldName)?.label) ||
						fieldNameMap[fieldName],
					values: [current.value],
				};
			}
			return acc;
		},
		{} as Record<string, { name: string; label: string; values: string[] }>,
	);

	if (conflicts?.name?.values.length && contact.name) {
		conflicts.name.values.push(contact.name);
	}

	if (conflicts?.contactManager?.values.length && contact.contactManager) {
		conflicts.contactManager.values.push(contact.contactManager);
	}

	return conflicts || {};
}

type ReviewContactModalProps = {
	contact: Serialized<ILivechatContact>;
	onCancel: () => void;
};

type HandleConflictsPayload = {
	name: string;
	contactManager: string;
	[key: string]: string;
};

const ReviewContactModal = ({ contact, onCancel }: ReviewContactModalProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const updateContact = useEndpoint('POST', '/v1/omnichannel/contacts.update');
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<HandleConflictsPayload>();

	const canViewCustomFields = useAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const { data: customFieldsMetadata = [] } = useCustomFieldsMetadata({
		scope: 'visitor',
		enabled: canViewCustomFields,
	});

	const handleConflicts = async ({ name, contactManager, ...customField }: HandleConflictsPayload) => {
		const payload = {
			name,
			contactManager,
			customFields: { ...customField },
			wipeConflicts: true,
		};

		try {
			await updateContact({ contactId: contact?._id, ...payload });
			dispatchToastMessage({ type: 'success', message: t('Contact_has_been_updated') });
			await queryClient.invalidateQueries(['getContactById']);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onCancel();
		}
	};

	const mappedConflicts = mapConflicts(contact, customFieldsMetadata);
	const conflictingFields = Object.values(mappedConflicts);

	return (
		<GenericModal
			icon={null}
			variant='warning'
			onCancel={onCancel}
			confirmText={t('Save')}
			onConfirm={handleSubmit(handleConflicts)}
			annotation={t('Contact_history_is_preserved')}
			title={t('Review_contact')}
		>
			<FieldGroup>
				{conflictingFields.map(({ name, label, values }, index) => {
					const isContactManagerField = name === 'contactManager';
					const mappedOptions = values.map((option) => [option, option] as const);
					const Component = isContactManagerField ? ContactManagerInput : Select;

					if (isContactManagerField && !hasLicense) {
						return null;
					}

					return (
						<Field key={index}>
							<FieldLabel>{t(label as TranslationKey)}</FieldLabel>
							<FieldRow>
								<Controller
									name={name}
									control={control}
									rules={{
										required: isContactManagerField ? undefined : t('Required_field', { field: t(label as TranslationKey) }),
									}}
									render={({ field: { value, onChange } }) => <Component options={mappedOptions} value={value} onChange={onChange} />}
								/>
							</FieldRow>
							<FieldHint>
								<Box display='flex' alignItems='center'>
									<Box mie={4}>{t('different_values_found', { number: values.length })}</Box>
									<Badge variant='primary' small />
								</Box>
							</FieldHint>
							{errors?.[name] && <FieldError>{errors?.[name]?.message}</FieldError>}
						</Field>
					);
				})}
			</FieldGroup>
		</GenericModal>
	);
};

export default ReviewContactModal;
