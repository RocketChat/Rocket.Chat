import type {
	IOutboundMessage,
	IOutboundProviderTemplate,
	TemplateComponent,
	TemplateParameter as CoreTemplateParameter,
} from '@rocket.chat/core-typings';

import type { SubmitPayload } from '../components/OutboundMessageWizard/forms';
import type { MessageFormSubmitPayload } from '../components/OutboundMessageWizard/forms/MessageForm';
import type { RecipientFormSubmitPayload } from '../components/OutboundMessageWizard/forms/RecipientForm/RecipientForm';
import type { RepliesFormSubmitPayload } from '../components/OutboundMessageWizard/forms/RepliesForm';
import type { TemplateParameter, TemplateParameters } from '../types/template';

export const isRecipientStepValid = (data: Partial<SubmitPayload>): data is Required<RecipientFormSubmitPayload> => {
	return !!(data.contactId && data.contact && data.provider && data.providerId && data.recipient && data.sender);
};

export const isMessageStepValid = (data: Partial<SubmitPayload>): data is Required<MessageFormSubmitPayload> => {
	return !!(data.templateId && data.template && data.templateParameters);
};

export const isRepliesStepValid = (data: Partial<SubmitPayload>): data is RepliesFormSubmitPayload => {
	return (!data.departmentId || !!data.department) && (!data.agentId || (!!data.agent && !!data.departmentId));
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
	departmentId,
	agentId,
}: {
	type: IOutboundMessage['type'];
	recipient: string;
	sender: string;
	template: IOutboundProviderTemplate;
	templateParameters: TemplateParameters;
	departmentId?: string;
	agentId?: string;
}): IOutboundMessage => {
	return {
		to: recipient,
		type,
		templateProviderPhoneNumber: sender,
		departmentId,
		agentId,
		template: {
			name: template.name,
			language: {
				code: template.language,
			},
			components: formatOutboundMessageComponents(template.components, templateParameters),
		},
	};
};
