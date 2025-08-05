import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

export type ComponentType = IOutboundProviderTemplate['components'][0]['type'];

export type ComponentFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type TemplateParameter = { type: 'text' | 'media'; value: string };

export type TemplateComponent = {
	type: 'header' | 'body' | 'footer';
	parameters: TemplateParameter[];
};

export type TemplateParameters = Partial<Record<ComponentType, TemplateParameter[]>>;

export type PlaceholderMetadata = {
	componentType: ComponentType;
	raw: string;
	value: string;
	index: number;
	format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};
