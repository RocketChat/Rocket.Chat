import type {
	IOutboundMessage,
	IOutboundProviderTemplate,
	TemplateComponent,
	TemplateParameter as CoreTemplateParameter,
} from '@rocket.chat/core-typings';

import type { SubmitPayload } from '../components/OutboundMessageWizard/forms';
import type { MessageFormSubmitPayload } from '../components/OutboundMessageWizard/forms/MessageForm';
import type { RecipientFormSubmitPayload } from '../components/OutboundMessageWizard/forms/RecipientForm';
import type { TemplateParameter, TemplateParameters } from '../definitions/template';

export const isRecipientStepValid = (data: Partial<SubmitPayload>): data is Required<RecipientFormSubmitPayload> => {
	return !!(data.contactId && data.contact && data.provider && data.providerId && data.recipient && data.sender);
};

export const isMessageStepValid = (data: Partial<SubmitPayload>): data is Required<MessageFormSubmitPayload> => {
	return !!(data.templateId && data.template && data.templateParameters);
};

const formatParameterForOutboundMessage = (parameter: TemplateParameter): CoreTemplateParameter => {
	switch (parameter.type) {
		case 'media':
			return { type: 'media', link: parameter.value, format: parameter.format };
		default:
			return { type: 'text', text: parameter.value };
	}
};

const formatOutboundMessageComponents = (
	components: IOutboundProviderTemplate['components'],
	parameters: TemplateParameters,
): TemplateComponent[] => {
	return components.map((component) => {
		const values = parameters[component.type] || [];
		return {
			type: component.type,
			parameters: values.map(formatParameterForOutboundMessage),
		};
	});
};

export const formatOutboundMessagePayload = ({
	recipient,
	sender,
	template,
	type = 'template',
	templateParameters,
}: {
	type: IOutboundMessage['type'];
	recipient: string;
	sender: string;
	template: IOutboundProviderTemplate;
	templateParameters: TemplateParameters;
}): IOutboundMessage => {
	return {
		to: recipient,
		type,
		templateProviderPhoneNumber: sender,
		template: {
			name: template.name,
			language: {
				code: template.language,
			},
			components: formatOutboundMessageComponents(template.components, templateParameters),
		},
	};
};
