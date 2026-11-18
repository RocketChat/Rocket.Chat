import type { AnchorHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type StatesLinkProps = ElementProps<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>;

/** A link for the next step, such as a page with more help. */
const StatesLink = (props: StatesLinkProps) => <Box is='a' rcx-states__link {...props} />;

export default StatesLink;
