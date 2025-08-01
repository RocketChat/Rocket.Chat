import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

import type { TemplateParameters } from '../definitions/template';

const placeholderPattern = new RegExp('{{(.*?)}}', 'g'); // e.g {{1}} or {{text}}

export const processTemplatePlaceholders = (template: IOutboundProviderTemplate | undefined) => {
	if (!template) {
		return [];
	}

	return template.components.flatMap((component) => {
		const format = component.type === 'HEADER' ? component.format : 'TEXT';
		return processPlaceholderText(component.text, component.type, format);
	});
};

export const processPlaceholderText = (
	text: string | undefined,
	componentType: IOutboundProviderTemplate['components'][0]['type'],
	format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' = 'TEXT',
) => {
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
	type: 'HEADER' | 'BODY' | 'FOOTER',
	template: IOutboundProviderTemplate,
	parameters?: TemplateParameters,
) => {
	const { components } = template;

	if (!components.length) {
		return;
	}

	const component = components.find((component) => component.type === type);

	if (!component) {
		return;
	}

	const componentParams = parameters?.[type];

	if (!componentParams?.length) {
		return component;
	}

	return {
		...component,
		text: replacePlaceholders(component.text, (placeholder, index) => {
			return componentParams[index - 1] || placeholder;
		}),
	};
};
