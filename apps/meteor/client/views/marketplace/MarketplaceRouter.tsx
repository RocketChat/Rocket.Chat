import React, { Suspense, ReactElement, ReactNode } from 'react';

import PageSkeleton from '../../components/PageSkeleton';

const MarketplaceRouter = ({ children }: { children?: ReactNode }): ReactElement => (
	<>{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />};</>
);

export default MarketplaceRouter;
