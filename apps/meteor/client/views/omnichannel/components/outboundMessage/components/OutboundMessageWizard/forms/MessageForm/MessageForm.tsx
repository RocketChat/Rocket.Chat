import type { IOutboundProviderTemplate, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup, Scrollable } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import type { ReactNode } from 'react';
import { useId, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import TemplateField from './components/TemplateField';
import TemplatePlaceholderField from './components/TemplatePlaceholderField';
import TemplatePreviewForm from './components/TemplatePreviewField';
import type { TemplateParameters } from '../../../../types/template';
import { extractParameterMetadata } from '../../../../utils/template';
import Form from '../../components/OutboundMessageForm';
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
		formState: { isSubmitting },
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

	const templateId = useWatch({ control, name: 'templateId' });
	const template = useMemo(() => templates?.find((template) => template.id === templateId), [templates, templateId]);
	const parametersMetadata = useMemo(() => (template ? extractParameterMetadata(template) : []), [template]);
	const customActions = useMemo(() => renderActions?.({ isSubmitting }), [isSubmitting, renderActions]);

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

	return (
		<Form id={messageFormId} onSubmit={handleSubmit(submit)} noValidate>
			<Scrollable vertical>
				<FieldGroup justifyContent='start' pi={2}>
					<TemplateField control={control} templates={templates} onChange={() => setValue('templateParameters', {})} />

					{parametersMetadata.map((metadata) => (
						<TemplatePlaceholderField key={metadata.id} control={control} metadata={metadata} contact={contact} />
					))}

					{template ? <TemplatePreviewForm control={control} template={template} /> : null}
				</FieldGroup>
			</Scrollable>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end'>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</Form>
	);
};

MessageForm.displayName = 'MessageForm';

export default MessageForm;
