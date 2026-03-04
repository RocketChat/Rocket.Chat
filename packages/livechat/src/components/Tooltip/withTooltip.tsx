import type { ComponentChildren, ComponentProps, FunctionalComponent } from 'preact';

import TooltipTrigger from './TooltipTrigger';

export const withTooltip = <TComponent extends FunctionalComponent<any>>(component: TComponent) => {
	const TooltipConnection = ({ tooltip, ...props }: { tooltip: ComponentChildren } & ComponentProps<TComponent>) => (
		<TooltipTrigger content={tooltip}>{component(props)}</TooltipTrigger>
	);
	TooltipConnection.displayName = `withTooltip(${component.name ?? component.displayName ?? 'Component'})`;

	return TooltipConnection;
};
