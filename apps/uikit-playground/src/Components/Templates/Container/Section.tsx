import { Box, Label } from '@rocket.chat/fuselage';

import Payload from './Payload';
import type { templateType } from '../../../utils/templates';

export type SectionProps = { template: templateType; index: number };

const Section = ({ template, index }: SectionProps) => (
	<Box mbs='25px' width='100%' key={index}>
		<Box mbe='5px'>
			<Label fontSize={24} fontWeight={800}>
				{template.heading}
			</Label>
		</Box>
		<Box mbe='15px'>
			<Label>{template.description}</Label>
		</Box>
		{template.payloads.map((payload, i) => (
			<Payload key={i} blocks={payload.blocks} surface={payload.surface} />
		))}
	</Box>
);

export default Section;
