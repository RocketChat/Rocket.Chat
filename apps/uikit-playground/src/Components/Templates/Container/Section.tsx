import { Box, Label } from '@rocket.chat/fuselage';

import Payload from './Payload';
import type { templateType } from '../../../utils/templates';

export type SectionProps = { template: templateType; index: number };

const Section = ({ template, index }: SectionProps) => (
	<Box marginBlockStart='x24' width='100%' key={index}>
		<Box marginBlockEnd='x4'>
			<Box fontSize={24} fontWeight={800}>
				{template.heading}
			</Box>
		</Box>
		<Box marginBlockEnd='x16'>
			<Label>{template.description}</Label>
		</Box>
		{template.payloads.map((payload, i) => (
			<Payload key={i} blocks={payload.blocks} surface={payload.surface} />
		))}
	</Box>
);

export default Section;
