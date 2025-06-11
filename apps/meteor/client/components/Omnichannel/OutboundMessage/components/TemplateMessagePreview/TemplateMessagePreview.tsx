import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import MarkdownText from '../../../../MarkdownText';

type TemplateMessagePreviewProps = {
	template: IOutboundProviderTemplate;
	params?: Record<string, string[]>;
};

const TemplateMessagePreview = ({ template, params }: TemplateMessagePreviewProps) => {
	const { components } = template;

	console.log(params);

	const [header, body] = useMemo(() => {
		const findComponentByType = (type: 'HEADER' | 'BODY' | 'FOOTER') => components.find((component) => component.type === type);

		const header = findComponentByType('HEADER');
		const body = findComponentByType('BODY');
		const footer = findComponentByType('FOOTER');

		return [header, body, footer];
	}, [components]);

	return (
		<Box mbs={12}>
			<Callout type='info' title={header?.text || ''}>
				<MarkdownText preserveHtml content={body?.text || ''} />
			</Callout>
		</Box>
	);
};

export default TemplateMessagePreview;
