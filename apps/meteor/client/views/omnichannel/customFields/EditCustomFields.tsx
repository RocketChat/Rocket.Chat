import type { ILivechatCustomField, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	Select,
	TextInput,
	ToggleSwitch,
	Box,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { FormProvider, useForm, Controller } from 'react-hook-form';

import {
	Contextualbar,
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarFooter,
	ContextualbarScrollableContent,
} from '../../../components/Contextualbar';
import { CustomFieldsAdditionalForm } from '../additionalForms';
import { useRemoveCustomField } from './useRemoveCustomField';

export type EditCustomFieldsFormData = {
	field: string;
	label: string;
	scope: 'visitor' | 'room';
	visibility: boolean;
	searchable: boolean;
	regexp: string;
	type: string;
	required: boolean;
	defaultValue: string;
	options: string;
	public: boolean;
};

const getInitialValues = (customFieldData: Serialized<ILivechatCustomField> | undefined) => ({
	field: customFieldData?._id || '',
	label: customFieldData?.label || '',
	scope: customFieldData?.scope || 'visitor',
	visibility: customFieldData?.visibility === 'visible',
	searchable: !!customFieldData?.searchable,
	regexp: customFieldData?.regexp || '',
	// additional props
	type: customFieldData?.type || 'input',
	required: !!customFieldData?.required,
	defaultValue: customFieldData?.defaultValue || '',
	options: customFieldData?.options || '',
	public: !!customFieldData?.public,
});

const EditCustomFields = ({ customFieldData }: { customFieldData?: Serialized<ILivechatCustomField> }) => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleDelete = useRemoveCustomField();

	const methods = useForm<EditCustomFieldsFormData>({ mode: 'onBlur', values: getInitialValues(customFieldData) });
	const {
		control,
		handleSubmit,
		formState: { isDirty, errors },
	} = methods;

	const saveCustomField = useMethod('livechat:saveCustomField');

	const handleSave = useEffectEvent(async ({ visibility, ...data }: EditCustomFieldsFormData) => {
		try {
			await saveCustomField(customFieldData?._id as unknown as string, {
				visibility: visibility ? 'visible' : 'hidden',
				...data,
			});

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries({
				queryKey: ['livechat-customFields'],
			});
			router.navigate('/omnichannel/customfields');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const scopeOptions: SelectOption[] = useMemo(
		() => [
			['visitor', t('Visitor')],
			['room', t('Room')],
		],
		[t],
	);

	const formId = useId();
	const fieldField = useId();
	const labelField = useId();
	const scopeField = useId();
	const visibilityField = useId();
	const searchableField = useId();
	const regexpField = useId();

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{customFieldData?._id ? t('Edit_Custom_Field') : t('New_Custom_Field')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/customfields')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FormProvider {...methods}>
					<form id={formId} onSubmit={handleSubmit(handleSave)}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={fieldField} required>
									{t('Field')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='field'
										control={control}
										rules={{
											required: t('Required_field', { field: t('Field') }),
											validate: (value) => (!/^[0-9a-zA-Z-_]+$/.test(value) ? t('error-invalid-custom-field-name') : undefined),
										}}
										render={({ field }) => (
											<TextInput
												id={fieldField}
												{...field}
												readOnly={Boolean(customFieldData?._id)}
												aria-required={true}
												aria-invalid={Boolean(errors.field)}
												aria-describedby={`${fieldField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors?.field && (
									<FieldError aria-live='assertive' id={`${fieldField}-error`}>
										{errors.field.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={labelField} required>
									{t('Label')}
								</FieldLabel>
								<FieldRow>
									<Controller
										name='label'
										control={control}
										rules={{ required: t('Required_field', { field: t('Label') }) }}
										render={({ field }) => (
											<TextInput
												id={labelField}
												{...field}
												aria-required={true}
												aria-invalid={Boolean(errors.label)}
												aria-describedby={`${labelField}-error`}
											/>
										)}
									/>
								</FieldRow>
								{errors?.label && (
									<FieldError aria-live='assertive' id={`${labelField}-error`}>
										{errors.label.message}
									</FieldError>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor={scopeField}>{t('Scope')}</FieldLabel>
								<FieldRow>
									<Controller
										name='scope'
										control={control}
										render={({ field }) => <Select id={scopeField} {...field} options={scopeOptions} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={visibilityField}>{t('Visible')}</FieldLabel>
									<Controller
										name='visibility'
										control={control}
										render={({ field: { value, ...field } }) => <ToggleSwitch id={visibilityField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={searchableField}>{t('Searchable')}</FieldLabel>
									<Controller
										name='searchable'
										control={control}
										render={({ field: { value, ...field } }) => <ToggleSwitch id={searchableField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={regexpField}>{t('Validation')}</FieldLabel>
								<FieldRow>
									<Controller name='regexp' control={control} render={({ field }) => <TextInput id={regexpField} {...field} />} />
								</FieldRow>
							</Field>
							{CustomFieldsAdditionalForm && <CustomFieldsAdditionalForm />}
						</FieldGroup>
					</form>
				</FormProvider>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/omnichannel/customfields')}>{t('Cancel')}</Button>
					<Button form={formId} data-qa-id='BtnSaveEditCustomFieldsPage' primary type='submit' disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{customFieldData?._id && (
					<Box mbs={8}>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={() => handleDelete(customFieldData._id)}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Box>
				)}
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default EditCustomFields;
