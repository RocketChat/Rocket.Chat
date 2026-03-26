import type { IOutboundProviderTemplate } from '@rocket.chat/apps-engine/definition/outboundCommunication';
import { capitalize } from '@rocket.chat/string-helpers';

import { extractParameterMetadata, processTemplatePreviewText } from './template';
import type { TemplateMediaParameter, TemplateComponent, TemplateParameterMetadata } from '../types/template';

const createMockTextMetadata = (
	templateId: string,
	type: TemplateComponent['type'],
	name: string,
	index = 0,
): TemplateParameterMetadata => {
	const placeholder = `{{${name}}}`;
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
	// Number parameters
	[[{ type: 'header', text: 'Parameter {{1}}', format: 'image' }], [createMockMediaMetadata('template-1', 'header', 'image')]],
	[
		[{ type: 'body', text: 'Parameter {{1}} and {{2}}' }],
		[createMockTextMetadata('template-1', 'body', '1', 0), createMockTextMetadata('template-1', 'body', '2', 1)],
	],
	[[{ type: 'footer', text: 'Parameter {{1}}' }], [createMockTextMetadata('template-1', 'footer', '1', 0)]],

	// Text parameters
	[[{ type: 'header', text: 'Parameter {{person_name}}', format: 'image' }], [createMockMediaMetadata('template-1', 'header', 'image')]],
	[
		[{ type: 'body', text: 'Parameter {{person_name}} and {{2}}' }],
		[createMockTextMetadata('template-1', 'body', 'person_name', 0), createMockTextMetadata('template-1', 'body', '2', 1)],
	],
	[[{ type: 'footer', text: 'Parameter {{person_name}}' }], [createMockTextMetadata('template-1', 'footer', 'person_name', 0)]],
];

describe('extractParameterMetadata', () => {
	test.each(variations)('should return the parameters metadata for "%i" component type', (components, expected) => {
		const parametersMetadata = extractParameterMetadata({ id: 'template-1', components });

		expect(parametersMetadata).toStrictEqual(expected);
	});
});

describe('processTemplatePreviewText', () => {
	it('should replace placeholder with the parameter value (number)', () => {
		const text = processTemplatePreviewText('Hello {{1}}', [{ type: 'text', value: 'World', format: 'text', placeholder: '{{1}}' }]);

		expect(text).toBe('Hello World');
	});

	it('should replace placeholder with the parameter value (text)', () => {
		const text = processTemplatePreviewText('Hello {{person_name}}', [
			{ type: 'text', value: 'World', format: 'text', placeholder: '{{person_name}}' },
		]);

		expect(text).toBe('Hello World');
	});

	it('should replace placeholder with the parameter value (mixed)', () => {
		const text = processTemplatePreviewText('Hello {{1}} and {{text_parameter}}', [
			{ type: 'text', value: 'World', format: 'text', placeholder: '{{1}}' },
			{ type: 'text', value: 'Hello', format: 'text', placeholder: '{{text_parameter}}' },
		]);

		expect(text).toBe('Hello World and Hello');
	});

	it('should replace placeholder with the first parameter value when parameter is duplicated', () => {
		const text = processTemplatePreviewText('Hello {{1}} and {{text_param}}', [
			{ type: 'text', value: 'World', format: 'text', placeholder: '{{1}}' },
			{ type: 'text', value: 'Hello', format: 'text', placeholder: '{{1}}' },
			{ type: 'text', value: 'Goodbye', format: 'text', placeholder: '{{text_param}}' },
			{ type: 'text', value: 'World', format: 'text', placeholder: '{{text_param}}' },
		]);

		expect(text).toBe('Hello World and Goodbye');
	});

	it('should keep the placeholder in case the parameter is an empty string', () => {
		const text = processTemplatePreviewText('Hello {{1}}', [{ type: 'text', value: '', format: 'text', placeholder: '{{1}}' }]);

		expect(text).toBe('Hello {{1}}');
	});
});
