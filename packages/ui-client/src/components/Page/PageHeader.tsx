import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useContext } from 'react';

import PageContext from './PageContext';
import PageHeaderNoShadow from './PageHeaderNoShadow';

type PageHeaderProps = {
	title: ReactNode;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
} & ComponentPropsWithoutRef<typeof PageHeaderNoShadow>;

const PageHeader = ({ borderBlockEndColor, ...props }: PageHeaderProps) => {
	const [border] = useContext(PageContext);

	return (
		<PageHeaderNoShadow
			borderBlockEndWidth='default'
			borderBlockEndColor={(borderBlockEndColor ?? border) ? 'extra-light' : 'transparent'}
			{...props}
		/>
	);
};

export default PageHeader;
