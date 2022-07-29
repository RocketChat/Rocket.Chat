import React, { useContext, FC, ReactNode } from 'react';

import PageContext from './PageContext';
import PageHeader from './PageHeader';

type PageHeaderWithBorderProps = {
	title: ReactNode;
};

const PageHeaderWithBorder: FC<PageHeaderWithBorderProps> = (props) => {
	const [border] = useContext(PageContext);

	return <PageHeader {...props} borderBlockEndColor={border ? 'neutral-200' : 'transparent'} />;
};

export default PageHeaderWithBorder;
