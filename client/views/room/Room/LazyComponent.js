import React, { Suspense } from 'react';

import VerticalBar from '../../../components/VerticalBar';

const LazyComponent = ({ template: TabbarTemplate, ...props }) => (
	<Suspense fallback={<VerticalBar.Skeleton />}>
		<TabbarTemplate {...props} />
	</Suspense>
);

export default LazyComponent;
