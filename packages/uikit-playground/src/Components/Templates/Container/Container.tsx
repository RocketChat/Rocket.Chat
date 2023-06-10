import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import type { templateType } from '../../../utils/templates';
import Section from './Section';

const Container = ({ templates }: { templates: templateType[] }) => {
  console.log('');
  return (
    <Box width="50%" mbs="80px" height="max-content">
      {templates &&
        templates.map((template, i) => (
          <Section template={template} index={i} />
        ))}
    </Box>
  );
};

export default Container;
