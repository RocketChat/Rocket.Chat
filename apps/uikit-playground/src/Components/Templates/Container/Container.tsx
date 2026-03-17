import { Box } from '@rocket.chat/fuselage';

import Section from './Section';
import type { templateType } from '../../../utils/templates';

const Container = ({ templates }: { templates: templateType[] }) => (
	<Box maxWidth='800px' margin='80px' width='90%' height='max-content'>
		{templates?.map((template, i) => <Section key={i} template={template} index={i} />)}
	</Box>
);

export default Container;
