import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

export type ComponentType = IOutboundProviderTemplate['components'][0]['type'];

export type TemplateComponent = {
	type: 'header' | 'body' | 'footer';
	parameters: TemplateParameter[];
};

export type TemplateParameters = Partial<Record<ComponentType, TemplateParameter[]>>;

type TextParameter = {
	type: 'text';
	value: string;
	format: 'text';
};

type MediaParameter = {
	type: 'media';
	value: string;
	format: 'image' | 'video' | 'document';
};

export type TemplateParameter = TextParameter | MediaParameter;

type WithMetadata<T extends TemplateParameter> = Omit<T, 'value'> & {
	componentType: ComponentType;
	id: string;
	index: number;
	name: string;
	placeholder: string;
};

export type TemplateParameterMetadata = WithMetadata<TextParameter> | WithMetadata<MediaParameter>;
