import type {
	IOutboundProviderTemplate,
	TemplateParameter as CoreTemplateParameter,
	TemplateComponent,
	IOutboundMessage,
} from '@rocket.chat/core-typings';

import type { ComponentFormat, ComponentType, TemplateParameter, TemplateParameters } from '../definitions/template';

const placeholderPattern = new RegExp('{{(.*?)}}', 'g'); // e.g {{1}} or {{text}}

export const processComponentPlaceholders = (components: IOutboundProviderTemplate['components']) => {
	if (!components.length) {
		return [];
	}

	return components.flatMap((component) => {
		const format = component.type === 'header' ? component.format : 'TEXT';
		return processPlaceholderText(component.type, component.text, format);
	});
};

export const processPlaceholderText = (componentType: ComponentType, text: string | undefined, format: ComponentFormat = 'TEXT') => {
	if (!text) {
		return [];
	}

	const matches = text.match(placeholderPattern) || [];
	const placeholders = new Set(matches);

	return Array.from(placeholders).map((raw, index) => ({
		raw,
		value: raw.slice(2, -2),
		componentType,
		format,
		index,
	}));
};

export const replacePlaceholders = (text = '', replacer: (substring: string, index: number) => string) => {
	return text.replace(placeholderPattern, replacer);
};

export const processComponent = (
	type: ComponentType,
	components: IOutboundProviderTemplate['components'],
	parameters?: TemplateParameter[],
) => {
	if (!components.length) {
		return;
	}

	const component = components.find((component) => component.type === type);

	if (!component) {
		return;
	}

	if (!parameters?.length) {
		return component;
	}

	return {
		...component,
		text: replacePlaceholders(component.text, (placeholder, index) => {
			const parameter = parameters[index - 1];
			return parameter ? parameter.value : placeholder;
		}),
	};
};

export const formatParameter = (format: ComponentFormat, value: string): TemplateParameter => {
	switch (format) {
		case 'IMAGE':
		case 'VIDEO':
		case 'DOCUMENT':
			return { type: 'media', value };
		default:
			return { type: 'text', value };
	}
};

export const formatParameterForOutboundMessage = (parameter: TemplateParameter): CoreTemplateParameter => {
	switch (parameter.type) {
		case 'media':
			return { type: 'media', link: parameter.value };
		default:
			return { type: 'text', text: parameter.value };
	}
};

export const formatParametersToOutboundMessageComponents = (parameters: TemplateParameters): TemplateComponent[] => {
	return Object.entries(parameters).map(([componentType, parameters]) => ({
		type: componentType as ComponentType,
		parameters: parameters.map(formatParameterForOutboundMessage),
	}));
};

export const formatOutboundMessage = ({
	recipient,
	sender,
	template,
	type = 'template',
	parameters,
}: {
	recipient: string;
	sender: string;
	template: IOutboundProviderTemplate;
	type: IOutboundMessage['type'];
	parameters: TemplateParameters;
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
			components: formatParametersToOutboundMessageComponents(parameters),
		},
	};
};
