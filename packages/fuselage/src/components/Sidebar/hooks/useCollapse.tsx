import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useId, type KeyboardEventHandler, type MouseEvent } from 'react';

const hasPropExpanded = (expanded: boolean | undefined) => expanded !== undefined;

export const useCollapse = ({
	expanded: propExpanded,
	defaultExpanded,
	disabled,
	noncollapsible,
	tabIndex = 0,
}: {
	expanded?: boolean;
	defaultExpanded?: boolean;
	disabled?: boolean;
	noncollapsible?: boolean;
	tabIndex?: number;
}) => {
	const [stateExpanded, toggleStateExpanded] = useToggle(defaultExpanded);
	const expanded = hasPropExpanded(propExpanded) ? propExpanded : stateExpanded;

	const panelExpanded = noncollapsible || expanded;

	const titleId = useId();
	const panelId = useId();

	const handleClick = (e: MouseEvent<HTMLElement>) => {
		if (disabled) {
			return;
		}
		e.currentTarget?.blur();
		toggleStateExpanded();
	};

	const handleKeyDown: KeyboardEventHandler = (event) => {
		if (disabled || event.currentTarget !== event.target) {
			return;
		}

		if (['Enter', 'Space'].includes(event.code)) {
			event.preventDefault();

			if (event.repeat) {
				return;
			}

			toggleStateExpanded();
		}
	};

	const collapsibleProps = {
		'aria-controls': panelId,
		'aria-expanded': expanded ? 'true' : 'false',
		'tabIndex': !disabled ? tabIndex : undefined,
		'onClick': handleClick,
		'onKeyDown': handleKeyDown,
	} as const;

	const nonCollapsibleProps = {
		'aria-disabled': 'true',
		'aria-expanded': 'true',
		'aria-labelledby': titleId,
	} as const;

	const barProps = noncollapsible ? nonCollapsibleProps : collapsibleProps;

	return { barProps, titleId, panelId, panelExpanded, expanded };
};
