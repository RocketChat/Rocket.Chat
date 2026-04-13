import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

export type ComponentType = IOutboundProviderTemplate['components'][0]['type'];

export type TemplateComponent = {
	type: 'header' | 'body' | 'footer';
	parameters: TemplateParameter[];
};

export type TemplateParameters = Partial<Record<ComponentType, TemplateParameter[]>>;

export type TemplateTextParameter = {
	type: 'text';
	value: string;
	format: 'text';
};

export type TemplateMediaParameter = {
	type: 'media';
	value: string;
	format: 'image' | 'video' | 'document';
};

export type TemplateParameter = TemplateTextParameter | TemplateMediaParameter;

type WithMetadata<T extends TemplateParameter> = Omit<T, 'value'> & {
	componentType: ComponentType;
	id: string;
	index: number;
	name: string;
	placeholder: string;
};

export type TemplateParameterMetadata = WithMetadata<TemplateTextParameter> | WithMetadata<TemplateMediaParameter>;
