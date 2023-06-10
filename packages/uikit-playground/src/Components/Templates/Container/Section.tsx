import { Box, Label } from '@rocket.chat/fuselage';
import React from 'react';

import Payload from './Payload';
import { templateType } from '../../../utils/templates';

const Section = ({
  template,
  index,
}: {
  template: templateType,
  index: number,
}) => (
  <Box mbs="25px" width="100%" key={index}>
    <Box mbe="5px">
      <Label fontSize={24} fontWeight={800}>
        {template.heading}
      </Label>
    </Box>
    <Box mbe="15px">
      <Label>{template.description}</Label>
    </Box>
    {template.payloads.map((payload) => (
      <Payload payload={payload} />
    ))}
  </Box>
);

export default Section;
