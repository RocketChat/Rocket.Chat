import type { IOutboundProviderTemplate, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { forwardRef, useId, useImperativeHandle, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TemplateParameters } from '../../TemplateEditor';
import TemplateEditor from '../../TemplateEditor';
import TemplateSelect from '../../TemplateSelect';
import { createSubmitHandler } from '../utils/createSubmitHandler';

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
	contact?: Serialized<ILivechatContact>;
	templates?: IOutboundProviderTemplate[];
	onSubmit?(values: MessageFormSubmitPayload): void;
	defaultValues?: {
		templateId?: string;
		templateParameters?: TemplateParameters;
	};
};

const MessageForm = forwardRef<MessageFormRef, MessageFormProps>((props, ref) => {
	const { defaultValues, templates, contact, onSubmit } = props;
	const { t } = useTranslation();
	const messageFormId = useId();

	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<MessageFormData>({
		defaultValues,
		mode: 'onSubmit',
		reValidateMode: 'onChange',
	});

	const [templateId] = useWatch({ control, name: ['templateId'] });

	const template = useMemo(() => templates?.find((template) => template.id === templateId), [templates, templateId]);

	const submit = useEffectEvent(async (values: MessageFormData) => {
		const { templateId, templateParameters } = values;

		if (!template) {
			throw Error('error-template-not-found');
		}

		const payload = { templateId, templateParameters, template };

		onSubmit?.(payload);

		return payload;
	});

	useImperativeHandle(ref, () => ({ submit: createSubmitHandler(submit, handleSubmit) }), [submit, handleSubmit]);

	return (
		<form id={messageFormId} onSubmit={handleSubmit(submit)}>
			<FieldGroup>
				<Field>
					<FieldLabel required htmlFor={`${messageFormId}-template`}>
						{t('Template')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='templateId'
							rules={{
								required: t('Required_field', { field: t('Template_message') }),
								validate: {
									templatesNotFound: () => (!templates?.length ? t('No_templates_available') : true),
								},
							}}
							render={({ field }) => (
								<TemplateSelect
									aria-labelledby={`${messageFormId}-template`}
									aria-required={true}
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
