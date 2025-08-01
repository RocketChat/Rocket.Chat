import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

export type TemplateParameters = Partial<Record<IOutboundProviderTemplate['components'][0]['type'], string[]>>;

export type PlaceholderMetadata = {
	componentType: keyof TemplateParameters;
	raw: string;
	value: string;
	index: number;
	format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
};
