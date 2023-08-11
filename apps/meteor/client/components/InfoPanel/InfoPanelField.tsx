import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const InfoPanelField: FC = ({ children }) => <Box mb={16}>{children}</Box>;

export default InfoPanelField;
