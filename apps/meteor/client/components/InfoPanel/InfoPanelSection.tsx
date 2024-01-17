import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const InfoPanelSection: FC<ComponentProps<typeof Box>> = (props) => <Box mb={24} {...props} />;

export default InfoPanelSection;
