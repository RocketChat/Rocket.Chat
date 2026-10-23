import type { AllHTMLAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type StatesLinkProps = BoxProps & AllHTMLAttributes<HTMLAnchorElement>;

const StatesLink = (props: StatesLinkProps) => <Box is='a' rcx-states__link {...props} />;

export default StatesLink;
