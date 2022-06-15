import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode } from 'react';

const CardFooterWrapper = ({ children }: { children: ReactNode }): ReactElement => <Box mbs='x16'>{children}</Box>;

export default CardFooterWrapper;
