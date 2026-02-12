import type { ReactElement } from 'react';

import { ReportCardEmptyState } from './ReportCardEmptyState';
import { ReportCardErrorState } from './ReportCardErrorState';
import { ReportCardLoadingState } from './ReportCardLoadingState';

type ReportCardContentProps = {
	isPending?: boolean;
	isError?: boolean;
	isDataFound?: boolean;
	subtitle?: string;
	onRetry?: () => void;
	children: ReactElement;
};
export const ReportCardContent = ({ isPending, isError, isDataFound, subtitle, onRetry, children }: ReportCardContentProps) => {
	if (isPending) {
		return <ReportCardLoadingState />;
	}
	if (isError) {
		return <ReportCardErrorState onRetry={onRetry} />;
	}
	if (!isDataFound) {
		return <ReportCardEmptyState subtitle={subtitle} />;
	}
	return children;
};
