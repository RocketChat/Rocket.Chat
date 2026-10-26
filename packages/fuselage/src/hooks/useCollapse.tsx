import { useId, useState, type KeyboardEventHandler, type MouseEvent } from 'react';

export type UseCollapseOptions = {
	expanded?: boolean;
	defaultExpanded?: boolean;
	disabled?: boolean;
	noncollapsible?: boolean;
	tabIndex?: number;
	onToggle?: (expanded: boolean) => void;
};

/**
 * The state and the bar attributes of a collapsible section. It is controlled when `expanded` is
 * defined, in which case a toggle only reports the next value through `onToggle`.
 */
export const useCollapse = ({
	expanded: propExpanded,
	defaultExpanded = false,
	disabled,
	noncollapsible,
	tabIndex = 0,
	onToggle,
}: UseCollapseOptions) => {
	const [stateExpanded, setStateExpanded] = useState(defaultExpanded);
	const controlled = propExpanded !== undefined;
	const expanded = controlled ? propExpanded : stateExpanded;

	const panelExpanded = noncollapsible || expanded;

	const titleId = useId();
	const panelId = useId();

	const toggle = () => {
		const next = !expanded;

		if (!controlled) {
			setStateExpanded(next);
		}

		onToggle?.(next);
	};

	const handleClick = (e: MouseEvent<HTMLElement>) => {
		if (disabled) {
			return;
		}
		e.currentTarget?.blur();
		toggle();
	};

	const handleKeyDown: KeyboardEventHandler = (event) => {
		if (disabled || event.currentTarget !== event.target) {
			return;
		}

		if (![' ', 'Enter'].includes(event.key)) {
			return;
		}

		event.preventDefault();

		if (event.repeat) {
			return;
		}

		toggle();
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
