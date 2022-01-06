import React, { useContext, FC, ComponentProps } from 'react';

import PageContext from './PageContext';
import PageScrollableContent from './PageScrollableContent';

type PageScrollableContentWithShadowProps = ComponentProps<typeof PageScrollableContent>;

const PageScrollableContentWithShadow: FC<PageScrollableContentWithShadowProps> = ({ onScrollContent, ...props }) => {
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
