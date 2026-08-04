import type { IOutboundProviderTemplate } from '@rocket.chat/apps-engine/definition/outboundCommunication';
import { capitalize } from '@rocket.chat/string-helpers';

import { extractParameterMetadata, processTemplatePreviewText } from './template';
import type { TemplateMediaParameter, TemplateComponent, TemplateParameterMetadata } from '../types/template';

const createMockTextMetadata = (templateId: string, type: TemplateComponent['type'], index = 0): TemplateParameterMetadata => {
	const placeholder = `{{${index + 1}}}`;
	return {
		id: `${templateId}.${type}.${placeholder}`,
		type: 'text',
		placeholder,
		name: capitalize(type),
		index,
		componentType: type,
		format: 'text',
	};
};

const createMockMediaMetadata = (
	templateId: string,
	type: TemplateComponent['type'],
	format: TemplateMediaParameter['format'],
): TemplateParameterMetadata => ({
	id: `${templateId}.${type}.mediaUrl`,
	type: 'media',
	placeholder: '',
	name: 'Media_URL',
	index: 0,
	componentType: type,
	format,
});

const variations: [IOutboundProviderTemplate['components'], TemplateParameterMetadata[]][] = [
	[[{ type: 'header', text: 'Parameter {{1}}', format: 'image' }], [createMockMediaMetadata('template-1', 'header', 'image')]],
	[
		[{ type: 'body', text: 'Parameter {{1}} and {{2}}' }],
		[createMockTextMetadata('template-1', 'body', 0), createMockTextMetadata('template-1', 'body', 1)],
	],
	[[{ type: 'footer', text: 'Parameter {{1}}' }], [createMockTextMetadata('template-1', 'footer', 0)]],
];

describe('extractParameterMetadata', () => {
	test.each(variations)('should return the parameters metadata for "%i" component type', (components, expected) => {
		const parametersMetadata = extractParameterMetadata({ id: 'template-1', components });

		expect(parametersMetadata).toStrictEqual(expected);
	});
});

describe('processTemplatePreviewText', () => {
	it('should replate placeholder with the parameter value', () => {
		const text = processTemplatePreviewText('Hello {{1}}', [{ type: 'text', value: 'World', format: 'text' }]);

		expect(text).toBe('Hello World');
	});

	it('it should keep the placeholder in case the parameter is an empty string', () => {
		const text = processTemplatePreviewText('Hello {{1}}', [{ type: 'text', value: '', format: 'text' }]);

		expect(text).toBe('Hello {{1}}');
	});
});
