import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useId, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { StylingBox } from '../Box';
import { Chevron } from '../Chevron';

export type AccordionItemProps = {
	children?: ReactNode;
	className?: string;
	defaultExpanded?: boolean;
	disabled?: boolean;
	expanded?: boolean;
	tabIndex?: number;
	title: ReactNode;
	noncollapsible?: boolean;
};

const AccordionItem = ({
	children,
	defaultExpanded,
	disabled = false,
	expanded: propExpanded,
	tabIndex = 0,
	title,
	noncollapsible = !title,
	...props
}: AccordionItemProps) => {
	const [stateExpanded, toggleStateExpanded] = useToggle(defaultExpanded);
	const expanded = propExpanded || stateExpanded;

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

	const handleKeyDown = (event: KeyboardEvent) => {
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

		toggleStateExpanded();
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

	return (
		<StylingBox {...props}>
			<section className={cx(cxx('rcx-box')('full'), 'rcx-accordion-item')}>
				{title && (
					<div role='button' className={cx(cxx('rcx-box')('full', 'animated'), cxx('rcx-accordion-item__bar')({ disabled }))} {...barProps}>
						<h2 className={cx(cxx('rcx-box')('full'), 'rcx-accordion-item__title')} id={titleId}>
							{title}
						</h2>
						{!noncollapsible && <Chevron size='x24' up={expanded} />}
					</div>
				)}
				<div className={cx(cxx('rcx-box')('full', 'animated'), cxx('rcx-accordion-item__panel')({ expanded: panelExpanded }))} id={panelId}>
					{children}
				</div>
			</section>
		</StylingBox>
	);
};

export default AccordionItem;
