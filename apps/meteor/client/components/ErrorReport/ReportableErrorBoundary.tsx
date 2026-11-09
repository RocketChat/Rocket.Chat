import type { ErrorInfo, ReactNode } from 'react';
import { useState } from 'react';
import type { ErrorBoundaryPropsWithRender, FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';

export type ReportableFallbackProps = FallbackProps & {
	componentStack?: string | null;
};

export type ReportableErrorBoundaryProps = Omit<ErrorBoundaryPropsWithRender, 'fallbackRender'> & {
	fallbackRender: (props: ReportableFallbackProps) => ReactNode;
};

/** An `ErrorBoundary` whose fallback also receives the component stack, so it can offer a complete error report. */
const ReportableErrorBoundary = ({ fallbackRender, onError, onReset, ...props }: ReportableErrorBoundaryProps) => {
	const [componentStack, setComponentStack] = useState<string | null>();

	const handleError = (error: unknown, info: ErrorInfo) => {
		setComponentStack(info.componentStack);
		onError?.(error, info);
	};

	const handleReset: ReportableErrorBoundaryProps['onReset'] = (details) => {
		setComponentStack(undefined);
		onReset?.(details);
	};

	return (
		<ErrorBoundary
			{...props}
			onError={handleError}
			onReset={handleReset}
			fallbackRender={(fallbackProps) => fallbackRender({ ...fallbackProps, componentStack })}
		/>
	);
};

export default ReportableErrorBoundary;
