import type { ComponentPropsWithoutRef, ComponentType } from 'react';

import type { StylingProps } from './stylingProps.js';
import { useStylingProps } from './useStylingProps.js';

export const withBoxStyling = <
	TComponent extends ComponentType<{
		className?: string;
	}>,
>(
	Component: TComponent,
) => {
	const WithBoxStyling = (props: ComponentPropsWithoutRef<TComponent> & Partial<StylingProps>) => {
		const propsWithoutStylingProps = useStylingProps(props);
		return <Component {...(propsWithoutStylingProps as any)} />;
	};

	WithBoxStyling.displayName = `WithBoxStyling(${Component.displayName || Component.name || 'Component'})`;

	return WithBoxStyling;
};
