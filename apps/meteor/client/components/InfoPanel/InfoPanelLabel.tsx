import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const InfoPanelLabel: FC<ComponentProps<typeof Box>> = (props) => <Box mb='x8' fontScale='p2m' color='default' {...props} />;

export default InfoPanelLabel;
