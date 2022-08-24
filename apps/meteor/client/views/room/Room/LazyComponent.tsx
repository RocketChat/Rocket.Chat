import React, { ComponentType, ReactElement, Suspense } from 'react';

import VerticalBar from '../../../components/VerticalBar';

type LazyComponentProps<TTemplateProps extends Record<string, unknown>> = {
	template: ComponentType<Omit<TTemplateProps, 'template'>>;
} & TTemplateProps;

const LazyComponent = <TTemplateProps extends Record<string, unknown>>({
	template: TabbarTemplate,
	...props
}: LazyComponentProps<TTemplateProps>): ReactElement => (
	<Suspense fallback={<VerticalBar.Skeleton />}>
		<TabbarTemplate {...props} />
	</Suspense>
);

export default LazyComponent;
