import { Box, Label } from '@rocket.chat/fuselage';

import type { templateType } from '../../../utils/templates';
import Payload from './Payload';

const Section = ({
  template,
  index,
}: {
  template: templateType;
  index: number;
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
      <Payload blocks={payload.blocks} surface={payload.surface} />
    ))}
  </Box>
);

export default Section;
