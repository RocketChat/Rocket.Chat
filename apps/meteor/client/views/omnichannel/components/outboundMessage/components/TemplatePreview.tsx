import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { Callout, Stack, Text } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../../components/MarkdownText';
import type { TemplateParameters, ComponentType } from '../types/template';
import { processTemplatePreviewText } from '../utils/template';

export type TemplatePreviewProps = {
	template: IOutboundProviderTemplate;
	parameters?: TemplateParameters;
	className?: string;
};

const TemplatePreview = ({ template, parameters = {}, className }: TemplatePreviewProps) => {
	const { t } = useTranslation();
	const previewId = useId();

	const { components } = template;

	const content = useMemo<Partial<Record<ComponentType, string>>>(() => {
		return Object.fromEntries(
			components.map((component) => {
				if (component.type === 'header' && component.format !== 'text') {
					return [component.type, `[${t('Media')}]`];
				}

				const values = parameters[component.type];
				const processedText = component.text ? processTemplatePreviewText(component.text, values) : '';

				return [component.type, processedText] as const;
			}),
		);
	}, [components, parameters, t]);

	return (
		<Stack gap='x4' className={className}>
			<Text is='p' fontScale='p2m' id={previewId}>
				{t('Message_preview')}
			</Text>
			<Callout type='info' icon='balloon-text' title={content.header || ''} aria-labelledby={previewId}>
				<MarkdownText parseEmoji content={content.body || ''} />
				<MarkdownText parseEmoji color='annotation' content={content.footer || ''} />
			</Callout>
		</Stack>
	);
};

export default TemplatePreview;
