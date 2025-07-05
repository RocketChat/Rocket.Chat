import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

import type { TemplateParameters } from '../../../definitions/template';

export type MessageFormSubmitPayload = {
	templateId: string;
	template: IOutboundProviderTemplate;
	templateParameters: TemplateParameters;
};
