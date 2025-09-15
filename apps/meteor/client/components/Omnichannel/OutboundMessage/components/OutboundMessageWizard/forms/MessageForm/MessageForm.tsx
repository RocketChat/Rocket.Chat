import type { IOutboundProviderTemplate, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { ReactNode } from 'react';
import { useId, useMemo } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import TemplatePlaceholderField from './components/TemplatePlaceholderField';
import TemplatePreviewForm from './components/TemplatePreviewField';
import type { TemplateParameters } from '../../../../definitions/template';
import { extractParameterMetadata } from '../../../../utils/template';
import TemplateSelect from '../../../TemplateSelect';
import { useFormKeyboardSubmit } from '../../hooks/useFormKeyboardSubmit';
import { cxp } from '../../utils/cx';
import { FormFetchError } from '../../utils/errors';

export type MessageFormData = {
	templateId: string;
	templateParameters: TemplateParameters;
};

export type MessageFormSubmitPayload = {
	templateId: string;
	template: IOutboundProviderTemplate;
	templateParameters: TemplateParameters;
};

type MessageFormProps = {
	contact?: Omit<Serialized<ILivechatContact>, 'contactManager'>;
	templates?: IOutboundProviderTemplate[];
	onSubmit(values: MessageFormSubmitPayload): void;
	renderActions?(state: { isSubmitting: boolean }): ReactNode;
	defaultValues?: {
		templateId?: string;
		templateParameters?: TemplateParameters;
	};
};

const MessageForm = (props: MessageFormProps) => {
	const { defaultValues, templates, contact, renderActions, onSubmit } = props;
	const dispatchToastMessage = useToastBarDispatch();
	const { t } = useTranslation();
	const messageFormId = useId();

	const {
		control,
		formState: { errors, isSubmitting },
		handleSubmit,
		setValue,
	} = useForm<MessageFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: {
			templateParameters: defaultValues?.templateParameters ?? {},
			templateId: defaultValues?.templateId ?? '',
		},
	});

	const { field: templateIdField } = useController({
		control,
		name: 'templateId',
		rules: {
			validate: {
				// NOTE: The order of these validations matters
				templatesNotFound: () => (!templates?.length ? t('No_templates_available') : true),
				templateNotFound: () => (templateId && !template ? t('Error_loading__name__information', { name: t('template') }) : true),
				required: (value) => (!value?.trim() ? t('Required_field', { field: t('Template_message') }) : true),
			},
		},
	});

	const templateId = useWatch({ control, name: 'templateId' });
	const template = useMemo(() => templates?.find((template) => template.id === templateId), [templates, templateId]);
	const parametersMetadata = useMemo(() => (template ? extractParameterMetadata(template) : []), [template]);
	const customActions = useMemo(() => renderActions?.({ isSubmitting }), [isSubmitting, renderActions]);

	const handleTemplateChange = useEffectEvent((value: string) => {
		setValue('templateParameters', {});
		templateIdField.onChange(value);
	});

	const submit = useEffectEvent(async (values: MessageFormData) => {
		try {
			const { templateId, templateParameters } = values;

			// It shouldn't be possible to get here without a template due to form validations.
			// Adding this to be safe and ts compliant
			if (!template) {
				throw new FormFetchError('error-template-not-found');
			}

			onSubmit({ templateId, templateParameters, template });
		} catch {
			dispatchToastMessage({ type: 'error', message: t('Something_went_wrong') });
		}
	});

	const formRef = useFormKeyboardSubmit(() => handleSubmit(submit)(), [submit, handleSubmit]);

	return (
		<form ref={formRef} id={messageFormId} onSubmit={handleSubmit(submit)} noValidate>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' required id={`${messageFormId}-template`}>
						{t('Template')}
					</FieldLabel>
					<FieldRow>
						<TemplateSelect
							aria-labelledby={`${messageFormId}-template`}
							aria-invalid={!!errors.templateId}
							aria-describedby={cxp(messageFormId, {
								'template-error': !!errors.templateId,
								'template-hint': true,
							})}
							placeholder={t('Select_template')}
							error={errors.templateId?.message}
							templates={templates || []}
							value={templateIdField.value}
							onChange={handleTemplateChange}
						/>
					</FieldRow>
					{errors.templateId && (
						<FieldError aria-live='assertive' id={`${templateId}-template-error`}>
							{errors.templateId.message}
						</FieldError>
					)}
					<FieldHint id={`${messageFormId}-template-hint`}>
						{/* TODO: Change to the correct address */}
						<a href='https://rocket.chat' target='_blank' rel='noopener noreferrer'>
							{t('Learn_more')}
						</a>
					</FieldHint>
				</Field>

				{parametersMetadata.map((metadata) => (
					<TemplatePlaceholderField key={metadata.id} control={control} metadata={metadata} contact={contact} />
				))}

				{template ? <TemplatePreviewForm control={control} template={template} /> : null}
			</FieldGroup>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end'>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</form>
	);
};

MessageForm.displayName = 'MessageForm';

export default MessageForm;
