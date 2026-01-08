import React, { ComponentType, ReactNode, ComponentProps } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ComponentErrorFallback } from '@rocket.chat/ui-client';
import { errorTrackingService } from '@rocket.chat/ui-client';

export function withErrorBoundary<T extends object>(
	Component: ComponentType<T>,
	fallback: ReactNode = <ComponentErrorFallback />,
	scope: 'global' | 'feature' | 'component' = 'component',
) {
	const WrappedComponent = (props: ComponentProps<typeof Component>) => (
		<ErrorBoundary
			fallback={fallback} 
			onError={(error) => {
				const severityMap = {
					global: 'critical' as const,
					feature: 'high' as const,
					component: 'medium' as const,
				};

				errorTrackingService.reportError(error, {
					scope,
					severity: severityMap[scope],
					recoverable: scope !== 'global',
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
