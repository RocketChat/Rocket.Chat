import type { ComponentType, ReactNode, ComponentProps } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function withErrorBoundary<T extends object>(Component: ComponentType<T>, fallback: ReactNode = null) {
	const WrappedComponent = function (props: ComponentProps<typeof Component>) {
		return (
			<ErrorBoundary fallback={<>{fallback}</>}>
				<Component {...props} />
			</ErrorBoundary>
		);
	};

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}

export { withErrorBoundary };
