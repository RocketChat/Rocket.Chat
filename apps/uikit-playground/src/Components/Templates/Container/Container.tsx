import { Box } from '@rocket.chat/fuselage';

import type { templateType } from '../../../utils/templates';
import Section from './Section';

const Container = ({ templates }: { templates: templateType[] }) => (
  <Box maxWidth="800px" margin="80px" width={'90%'} height="max-content">
    {templates &&
      templates.map((template, i) => <Section template={template} index={i} />)}
  </Box>
);

export default Container;
