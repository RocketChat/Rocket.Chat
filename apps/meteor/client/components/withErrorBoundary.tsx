import React, { ComponentType, ReactNode, ComponentProps } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ComponentErrorFallback } from '../components/errors/ErrorFallbacks';
import { errorTrackingService } from '../services/ErrorTrackingService';

export function withErrorBoundary<T extends object>(
	Component: ComponentType<T>,
	fallback: ReactNode = <ComponentErrorFallback />,
	scope: 'global' | 'feature' | 'component' = 'component',
) {
	const WrappedComponent = (props: ComponentProps<typeof Component>) => (
		<ErrorBoundary
			fallback={<>{fallback}</>}
			onError={(error) => {
				errorTrackingService.reportError(error, {
					scope,
					severity: scope === 'global' ? 'critical' : 'high',
					recoverable: true,
					componentPath: Component.displayName || Component.name,
				});
			}}
		>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
