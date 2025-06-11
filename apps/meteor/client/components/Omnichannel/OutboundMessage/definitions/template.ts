import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

export type TemplateParameters = Partial<Record<IOutboundProviderTemplate['components'][0]['type'], string[]>>;
