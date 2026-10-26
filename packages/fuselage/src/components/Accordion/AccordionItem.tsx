import type { ReactNode } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';
import { useCollapse } from '../../hooks/useCollapse';
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
	onToggle?: (expanded: boolean) => void;
};

const AccordionItem = ({
	children,
	defaultExpanded,
	disabled = false,
	expanded: propExpanded,
	tabIndex = 0,
	title,
	noncollapsible = !title,
	onToggle,
	...props
}: AccordionItemProps) => {
	const { barProps, titleId, panelId, panelExpanded, expanded } = useCollapse({
		expanded: propExpanded,
		defaultExpanded,
		disabled,
		noncollapsible,
		tabIndex,
		onToggle,
	});

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
