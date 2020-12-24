import { ScrollableProps } from '@rocket.chat/fuselage';
import React, { useContext, FC } from 'react';

import PageScrollableContent from './PageScrollableContent';
import PageContext from './PageContext';

type PageScrollableContentWithShadowProps = {
	onScrollContent?: ScrollableProps['onScrollContent'];
};

const PageScrollableContentWithShadow: FC<PageScrollableContentWithShadowProps> = ({ onScrollContent, ...props }) => {
	const [, setBorder] = useContext(PageContext);
	return <PageScrollableContent
		onScrollContent={({ top, ...args }): void => {
			setBorder(!top);
			onScrollContent && onScrollContent({ top, ...args });
		}}
		{ ...props }
	/>;
};

export default PageScrollableContentWithShadow;
