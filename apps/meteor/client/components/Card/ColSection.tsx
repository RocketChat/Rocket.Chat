import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const ColSection: FC<ComponentProps<typeof Box>> = (props) => <Box rcx-card-col-section mb='x8' color='info' {...props} />;

export default ColSection;
