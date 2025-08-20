import type { IOutboundProviderTemplate } from '@rocket.chat/apps-engine/definition/outboundComunication';
import { capitalize } from '@rocket.chat/string-helpers';

import { extractParameterMetadata, processTemplatePreviewText } from './template';
import type { TemplateMediaParameter, TemplateComponent, TemplateParameterMetadata } from '../definitions/template';

const createMockTextMetadata = (type: TemplateComponent['type'], index = 0): TemplateParameterMetadata => {
	const placeholder = `{{${index + 1}}}`;
	return {
		id: `${type}.${placeholder}`,
		type: 'text',
		placeholder,
		name: capitalize(type),
		index,
		componentType: type,
		format: 'text',
	};
};

const createMockMediaMetadata = (type: TemplateComponent['type'], format: TemplateMediaParameter['format']): TemplateParameterMetadata => ({
	id: `${type}.mediaUrl`,
	type: 'media',
	placeholder: '',
	name: 'Media_URL',
	index: 0,
	componentType: type,
	format,
});

const variations: [IOutboundProviderTemplate['components'], TemplateParameterMetadata[]][] = [
	[[{ type: 'header', text: 'Parameter {{1}}', format: 'image' }], [createMockMediaMetadata('header', 'image')]],
	[[{ type: 'body', text: 'Parameter {{1}} and {{2}}' }], [createMockTextMetadata('body', 0), createMockTextMetadata('body', 1)]],
	[[{ type: 'footer', text: 'Parameter {{1}}' }], [createMockTextMetadata('footer', 0)]],
];

describe('extractParameterMetadata', () => {
	test.each(variations)('should return the parameters metadata for "%i" component type', (components, expected) => {
		const parametersMetadata = extractParameterMetadata(components);

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
