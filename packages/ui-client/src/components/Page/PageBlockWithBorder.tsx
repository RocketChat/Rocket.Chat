import type { BoxProps } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';
import { useContext } from 'react';

import PageBlock from './PageBlock';
import PageContext from './PageContext';

export type PageBlockWithBorderProps = BoxProps & RefAttributes<HTMLElement>;

const PageBlockWithBorder = ({ ref, ...props }: PageBlockWithBorderProps) => {
	const [border] = useContext(PageContext);
	return <PageBlock ref={ref} {...props} borderBlockEndColor={border ? 'extra-light' : 'transparent'} />;
};

export default PageBlockWithBorder;
