import type { ComponentPropsWithoutRef } from 'react';
import React, { useContext } from 'react';

import PageContext from './PageContext';
import PageScrollableContent from './PageScrollableContent';

type PageScrollableContentWithShadowProps = ComponentPropsWithoutRef<typeof PageScrollableContent>;

const PageScrollableContentWithShadow = ({ onScrollContent, ...props }: PageScrollableContentWithShadowProps) => {
	const [, setBorder] = useContext(PageContext);
	return (
		<PageScrollableContent
			onScrollContent={({ top, ...args }: { top: boolean }): void => {
				setBorder(!!top);
				onScrollContent?.({ top, ...args });
			}}
			{...props}
		/>
	);
};

export default PageScrollableContentWithShadow;
