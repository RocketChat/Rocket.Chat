import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <Box
    pbs="20px"
    pis={'20px'}
    display="flex"
    flexDirection="column"
    alignItems="flex-start"
    justifyContent="flex-start"
    children={children}
    width="100%"
    overflow="auto"
  />
);

export default Wrapper;
