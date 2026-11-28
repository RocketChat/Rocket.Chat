import type { AnchorHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type StatesLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

const StatesLink = (props: StatesLinkProps) => <Box is='a' rcx-states__link {...props} />;

export default StatesLink;
