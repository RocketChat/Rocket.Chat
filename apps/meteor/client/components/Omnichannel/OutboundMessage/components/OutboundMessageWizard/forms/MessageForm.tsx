import type { IOutboundProviderTemplate, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { forwardRef, useId, useImperativeHandle, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TemplateParameters } from '../../../definitions/template';
import TemplateEditor from '../../TemplateEditor';
import TemplateSelect from '../../TemplateSelect';
import { createSubmitHandler } from '../utils/createSubmitHandler';
import { FormFetchError } from '../utils/errors';

export type MessageFormData = {
	templateId: string;
	templateParameters: TemplateParameters;
};

export type MessageFormSubmitPayload = {
	templateId: string;
	template: IOutboundProviderTemplate;
	templateParameters: TemplateParameters;
};

export type MessageFormRef = {
	submit: () => Promise<MessageFormSubmitPayload>;
};

type MessageFormProps = {
	contact?: Omit<Serialized<ILivechatContact>, 'contactManager'>;
	templates?: IOutboundProviderTemplate[];
	onSubmit?(values: MessageFormSubmitPayload): void;
	defaultValues?: {
		templateId?: string;
		templateParameters?: TemplateParameters;
	};
};

const MessageForm = forwardRef<MessageFormRef, MessageFormProps>((props, ref) => {
	const { defaultValues, templates, contact } = props;
	const { t } = useTranslation();
	const messageFormId = useId();

	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<MessageFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: {
			templateParameters: defaultValues?.templateParameters || {},
			templateId: defaultValues?.templateId ?? '',
		},
	});

	const templateId = useWatch({ control, name: 'templateId' });

	const template = useMemo(() => templates?.find((template) => template.id === templateId), [templates, templateId]);

	const submit = useEffectEvent(async (values: MessageFormData) => {
		const { templateId, templateParameters } = values;

		// It shouldn't be possible to get here without a template due to form validations.
		// Adding this to be safe and ts compliant
		if (!template) {
			throw new FormFetchError('error-template-not-found');
		}

		return { templateId, templateParameters, template };
	});

	useImperativeHandle(ref, () => ({ submit: createSubmitHandler(submit, handleSubmit) }), [submit, handleSubmit]);

	return (
		<form id={messageFormId}>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' required id={`${messageFormId}-template`}>
						{t('Template')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='templateId'
							rules={{
								validate: {
									templatesNotFound: () => (!templates?.length ? t('No_templates_available') : true),
									templateNotFound: () => (templateId && !template ? t('Error_loading__name__information', { name: t('template') }) : true),
									required: (value) => (!value?.trim() ? t('Required_field', { field: t('Template_message') }) : true),
								},
							}}
							render={({ field }) => (
								<TemplateSelect
									aria-labelledby={`${messageFormId}-template`}
									aria-invalid={!!errors.templateId}
									aria-describedby={errors.templateId && `${messageFormId}-template-error`}
									placeholder={t('Select_template')}
									error={errors.templateId?.message}
									templates={templates || []}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.templateId && (
						<FieldError aria-live='assertive' id={`${templateId}-contact-error`}>
							{errors.templateId.message}
						</FieldError>
					)}
					<FieldHint>
						{/* TODO: Change to the correct address */}
						<a href='https://rocket.chat' target='_blank' rel='noopener noreferrer'>
							{t('Learn_more')}
						</a>
					</FieldHint>
				</Field>

				{template ? (
					<Controller
						control={control}
						name='templateParameters'
						render={({ field }) => (
							<TemplateEditor
								maxHeight={400}
								overflowY='scroll'
								overflowX='hidden'
								p={2}
								pie={20}
								m={-2}
								mbs={24}
								mie={-20}
								template={template}
								parameters={field.value}
								contact={contact}
								onChange={field.onChange}
							/>
						)}
					/>
				) : null}
			</FieldGroup>
		</form>
	);
});

MessageForm.displayName = 'MessageForm';

export default MessageForm;
