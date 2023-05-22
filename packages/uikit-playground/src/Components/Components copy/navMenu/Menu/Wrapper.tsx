import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <Box
    pbs='80px'
    pis={'50px'}
    display='inline-flex'
    flexDirection='column'
    alignItems='center'
    justifyContent='space-between'
    verticalAlign='middle'
    children={children}
    height='max-content'
    width='100%'
  />
);

export default Wrapper;
