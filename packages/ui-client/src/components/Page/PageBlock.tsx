import type { BoxProps } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

import PageContent from './PageContent';

export type PageBlockProps = BoxProps & RefAttributes<HTMLElement>;

const PageBlock = ({ ref, ...props }: PageBlockProps) => (
	<PageContent borderBlockEndColor='transparent' {...props} paddingBlock={16} ref={ref} borderBlockEndWidth='default' height='auto' />
);

export default PageBlock;
