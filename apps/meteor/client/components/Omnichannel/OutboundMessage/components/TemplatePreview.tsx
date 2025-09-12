import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../MarkdownText';
import type { TemplateParameters, ComponentType } from '../definitions/template';
import { processTemplatePreviewText } from '../utils/template';

type TemplatePreviewProps = {
	template: IOutboundProviderTemplate;
	parameters?: TemplateParameters;
};

const TemplatePreview = ({ template, parameters = {} }: TemplatePreviewProps) => {
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
		<Box mbs={12}>
			<Box is='p' fontScale='p2m' mbe={2} id={previewId}>
				{t('Message_preview')}
			</Box>
			<Callout type='info' icon='balloon-text' title={content.header || ''} aria-labelledby={previewId}>
				<MarkdownText parseEmoji content={content.body || ''} />
				<MarkdownText parseEmoji color='annotation' content={content.footer || ''} />
			</Callout>
		</Box>
	);
};

export default TemplatePreview;
