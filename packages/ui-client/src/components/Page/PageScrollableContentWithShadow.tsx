import type { ComponentPropsWithoutRef } from 'react';
import { useContext } from 'react';

import PageContext from './PageContext';
import PageScrollableContent from './PageScrollableContent';

type PageScrollableContentWithShadowProps = ComponentPropsWithoutRef<typeof PageScrollableContent>;

const PageScrollableContentWithShadow = ({ onScroll, ...props }: PageScrollableContentWithShadowProps) => {
	const [, setBorder] = useContext(PageContext);
	return (
		<PageScrollableContent
			onScroll={(args) => {
				const top = args.elements().viewport.scrollTop;
				setBorder(!!top);
				onScroll?.(args);
			}}
			{...props}
		/>
	);
};

export default PageScrollableContentWithShadow;
