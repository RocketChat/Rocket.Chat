import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../MarkdownText';
import type { TemplateParameters } from '../definitions/template';
import { processComponent } from '../utils/template';

type TemplatePreviewProps = {
	template: IOutboundProviderTemplate;
	parameters?: TemplateParameters;
};

const TemplatePreview = ({ template, parameters }: TemplatePreviewProps) => {
	const { t } = useTranslation();
	const previewId = useId();
	const [header, body, footer] = useMemo(() => {
		const components = template.components || [];
		const header = processComponent('header', components, parameters?.header || []);
		const body = processComponent('body', components, parameters?.body || []);
		const footer = processComponent('footer', components, parameters?.footer || []);

		return [header, body, footer];
	}, [parameters, template]);

	return (
		<Box mbs={12}>
			<Box is='p' fontScale='p2m' mbe={2} id={previewId}>
				{t('Message_preview')}
			</Box>
			<Callout type='info' icon='balloon-text' title={header?.text || ''} aria-labelledby={previewId}>
				<MarkdownText preserveHtml content={body?.text || ''} />
				<MarkdownText preserveHtml content={footer?.text || ''} />
			</Callout>
		</Box>
	);
};

export default TemplatePreview;
