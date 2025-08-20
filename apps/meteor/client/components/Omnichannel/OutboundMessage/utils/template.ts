import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/string-helpers';

import type { ComponentType, TemplateParameterMetadata, TemplateParameter, TemplateParameters } from '../definitions/template';

const placeholderPattern = new RegExp('{{(.*?)}}', 'g'); // e.g {{1}} or {{text}}

export const extractParameterMetadata = (components: IOutboundProviderTemplate['components']) => {
	if (!components.length) {
		return [];
	}

	return components.flatMap((component) => {
		const format = component.type === 'header' ? component.format : 'text';
		return parseComponentText(component.type, component.text, format);
	});
};

export const parseComponentText = (
	componentType: ComponentType,
	text: string | undefined,
	format: TemplateParameter['format'] = 'text',
): TemplateParameterMetadata[] => {
	if (format !== 'text') {
		return [
			{
				id: `${componentType}.mediaUrl`,
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
		id: `${componentType}.${placeholder}`,
		placeholder,
		name: capitalize(componentType),
		type: 'text',
		componentType,
		format,
		index,
	}));
};

export const replacePlaceholders = (text = '', replacer: (substring: string, index: number) => string) => {
	return text.replace(placeholderPattern, replacer);
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

	return replacePlaceholders(processedText, (placeholder, index) => {
		const parameter = parameters[index - 1];
		return parameter.value || placeholder;
	});
};

export const convertMetadataToParameter = (metadata: TemplateParameterMetadata, value: string): TemplateParameter => {
	switch (metadata.type) {
		case 'media':
			return { type: 'media', value, format: metadata.format };
		default:
			return { type: 'text', value, format: metadata.format };
	}
};

export const updateTemplateParameters = (parameters: TemplateParameters, metadata: TemplateParameterMetadata, value: string) => {
	const { componentType, index } = metadata;

	const componentParameters = [...(parameters[componentType] || [])];

	componentParameters[index] = convertMetadataToParameter(metadata, value);

	return {
		...parameters,
		[componentType]: componentParameters,
	};
};
