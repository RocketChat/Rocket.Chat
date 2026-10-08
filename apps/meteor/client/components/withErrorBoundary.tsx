import type { ComponentType, ReactNode, ComponentProps } from 'react';

import ReportableErrorBoundary from './ErrorReport/ReportableErrorBoundary';
import GenericError from './GenericError';

function withErrorBoundary<T extends object>(Component: ComponentType<T>, fallback: ReactNode = null) {
	const WrappedComponent = function (props: ComponentProps<typeof Component>) {
		return (
			<ReportableErrorBoundary
				fallbackRender={(fallbackProps) => {
					if (fallback) {
						return fallback;
					}

					return <GenericError errorReport={fallbackProps} />;
				}}
			>
				<Component {...props} />
			</ReportableErrorBoundary>
		);
	};

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}

export { withErrorBoundary };
