import type { AnchorHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type StatesLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

const StatesLink = (props: StatesLinkProps) => <Box is='a' rcx-states__link {...props} />;

export default StatesLink;
