import React from 'react';
import type { ReactElement } from 'react';

import { ReportCardEmptyState } from './ReportCardEmptyState';
import { ReportCardErrorState } from './ReportCardErrorState';
import { ReportCardLoadingState } from './ReportCardLoadingState';

type ReportCardContentProps = {
	isLoading?: boolean;
	isError?: boolean;
	isDataFound?: boolean;
	subtitle?: string;
	onRetry?: () => void;
	children: ReactElement;
};
export const ReportCardContent = ({ isLoading, isError, isDataFound, subtitle, onRetry, children }: ReportCardContentProps) => {
	if (isLoading) {
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
