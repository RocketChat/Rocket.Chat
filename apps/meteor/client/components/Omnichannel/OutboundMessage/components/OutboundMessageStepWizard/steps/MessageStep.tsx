import { Field, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useId, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { StepsWizardContent } from '../../../../../StepsWizard';
import { processPlaceholders } from '../../../utils/template';
import TemplateMessagePreview from '../../TemplateMessagePreview';
import PlaceholderInput from '../../TemplatePlaceholderSelector';
import TemplateSelect from '../../TemplateSelect';
import type { OutboundMessageFormData } from '../OutboundMessageWizard';

type PlaceholderMetadata = {
	componentType: string;
	raw: string;
	value: string;
};

const MessageStep = () => {
	const { t } = useTranslation();
	const messageId = useId();
	const { control, getValues } = useFormContext<OutboundMessageFormData>();

	const [contact, provider, sender, templateId, placeholders] = useWatch({
		name: ['contact', 'provider', 'sender', 'templateId', 'placeholders'],
		control,
	});

	const template = useMemo(() => {
		const templates = provider?.templates[sender] || [];
		return templates.find((template) => template.id === templateId);
	}, [provider?.templates, sender, templateId]);

	const placeholdersMetadata = useMemo<PlaceholderMetadata[]>(() => {
		if (!template) {
			return [];
		}

		return template.components.flatMap((component) => processPlaceholders(component.text, component.type));
	}, [template]);

	const handleStepValidation = useEffectEvent(() => {
		const { contact } = getValues();
		return !!contact;
	});

	return (
		<StepsWizardContent title='Message' validate={handleStepValidation}>
			<form>
				<FieldGroup>
					<Field>
						<FieldLabel required htmlFor={`${messageId}-template`}>
							{t('Template')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='templateId'
								render={({ field }) => (
									<TemplateSelect
										aria-labelledby={`${messageId}-template`}
										templates={provider?.templates[sender] || []}
										value={field.value}
										onChange={field.onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>

					{/* TODO: not use index here */}
					{placeholdersMetadata.map((placeholder, index) => (
						<Field key={`${placeholder.componentType}.${placeholder.value}`}>
							<FieldLabel id={`${placeholder.componentType}.${placeholder.value}`}>
								{placeholder.componentType} {placeholder.raw}
							</FieldLabel>
							<FieldRow>
								<Controller
									name={`placeholders.${placeholder.componentType}.${index}`}
									render={({ field }) => <PlaceholderInput contact={contact} value={field.value} onChange={field.onChange} />}
								/>
							</FieldRow>
						</Field>
					))}
				</FieldGroup>
			</form>

			{template ? <TemplateMessagePreview template={template} params={placeholders} /> : null}
		</StepsWizardContent>
	);
};

export default MessageStep;
