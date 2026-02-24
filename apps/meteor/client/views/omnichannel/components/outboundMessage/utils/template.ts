import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/string-helpers';

import type { ComponentType, TemplateParameterMetadata, TemplateParameter } from '../types/template';

const placeholderPattern = new RegExp('{{(.*?)}}', 'g'); // e.g {{1}} or {{text}}

export const extractParameterMetadata = (template: Pick<IOutboundProviderTemplate, 'id' | 'components'>) => {
	if (!template.components?.length) {
		return [];
	}

	return template.components.flatMap((component) => {
		const format = component.type === 'header' ? component.format : 'text';
		return parseComponentText(template.id, component.type, component.text, format);
	});
};

export const parseComponentText = (
	templateId: string,
	componentType: ComponentType,
	text: string | undefined,
	format: TemplateParameter['format'] = 'text',
): TemplateParameterMetadata[] => {
	if (format !== 'text') {
		return [
			{
				id: `${templateId}.${componentType}.mediaUrl`,
				placeholder: '',
				name: 'Media_URL',
				type: 'media',
				componentType,
				format,
				index: 0,
			},
		];
	}

	if (!text) {
		return [];
	}

	const matches = text.match(placeholderPattern) || [];
	const placeholders = new Set(matches);

	return Array.from(placeholders).map((placeholder, index) => ({
		id: `${templateId}.${componentType}.${placeholder}`,
		placeholder,
		name: capitalize(componentType),
		type: 'text',
		componentType,
		format,
		index,
	}));
};

export const replacePlaceholders = (text = '', replacer: (substring: string, captured: number) => string) => {
	return text.replace(placeholderPattern, (match, captured) => replacer(match, captured));
};

const replaceLineBreaks = (text: string) => {
	return text.replace(/([^\n])\n(?!\n)/g, '$1  \n');
};

export const processTemplatePreviewText = (text: string, parameters: TemplateParameter[] = []): string => {
	if (!text) {
		return text;
	}

	const processedText = replaceLineBreaks(text);

	if (!parameters?.length) {
		return processedText;
	}

	return replacePlaceholders(processedText, (placeholder, captured) => {
		const index = Number(captured) - 1;

		if (!Number.isFinite(index) || index < 0) {
			return placeholder;
		}

		const parameter = parameters[index];
		return parameter?.value || placeholder;
	});
};
