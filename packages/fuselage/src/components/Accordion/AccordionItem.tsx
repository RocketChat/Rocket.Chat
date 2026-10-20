import { useToggle } from '@rocket.chat/fuselage-hooks';
import { styled, Text, View, type GetProps } from '@tamagui/web';
import { useId, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { borderWidth, fontScale, size, spacing } from '../../styleTokens';
import { StylingBox } from '../Box';
import { Chevron } from '../Chevron';
import { accordionBoxStyle } from './Accordion';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const AccordionItemFrame = styled(View, {
	render: 'section',
	...accordionBoxStyle,
});

const AccordionItemBar = styled(View, {
	...accordionBoxStyle,
	flexDirection: 'row',
	minHeight: size('x88'),
	paddingBlock: `calc(${spacing('x32')} - ${borderWidth('default')})`,
	paddingInline: `calc(${spacing('x8')} - ${borderWidth('default')})`,
	textAlign: 'start',
	color: String(textIconColors['font-titles-labels']),
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: 'transparent',
	borderTopColor: String(strokeColors['stroke-extra-light']),

	variants: {
		// The bar is focusable, so it carries `tabindex`
		clickable: {
			true: {
				cursor: 'pointer',
				outlineWidth: 0,
				backgroundColor: { hover: String(surfaceColors['surface-tint']) },
				borderColor: { default: 'transparent', focus: String(strokeColors['stroke-highlight']) },
				borderTopColor: { default: String(strokeColors['stroke-extra-light']), focus: String(strokeColors['stroke-highlight']) },
				boxShadow: { focus: `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight']}` },
			},
		},
		// Not `disabled`, which Tamagui would also turn into an `aria-disabled` attribute
		isDisabled: {
			true: {
				cursor: 'not-allowed',
				color: String(textIconColors['font-disabled']),
				backgroundColor: String(surfaceColors['surface-disabled']),
			},
		},
	} as const,
});

const h4 = fontScale('h4')!;

const AccordionItemTitle = styled(Text, {
	render: 'h2',
	...accordionBoxStyle,
	display: 'block',
	flexGrow: 1,
	flexBasis: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	fontSize: h4.fontSize,
	fontWeight: String(h4.fontWeight) as '700',
	lineHeight: h4.lineHeight,
	letterSpacing: h4.letterSpacing,
});

const AccordionItemPanel = styled(View, {
	...accordionBoxStyle,
	display: 'block',
	visibility: 'hidden',
	overflow: 'hidden',
	height: 0,
	paddingBlock: 0,
	paddingInline: spacing('x8'),

	variants: {
		expanded: {
			true: {
				visibility: 'visible',
				height: 'auto',
				paddingBlock: spacing('x32'),
			},
		},
	} as const,
});

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
			<AccordionItemFrame className='rcx-accordion-item'>
				{title && (
					<AccordionItemBar
						role='button'
						clickable={!noncollapsible && !disabled}
						isDisabled={disabled}
						className={cx('rcx-box--animated', cxx('rcx-accordion-item__bar')({ disabled }))}
						{...(barProps as unknown as GetProps<typeof AccordionItemBar>)}
					>
						<AccordionItemTitle className='rcx-accordion-item__title' id={titleId}>
							{title}
						</AccordionItemTitle>
						{!noncollapsible && <Chevron size='x24' up={expanded} />}
					</AccordionItemBar>
				)}
				<AccordionItemPanel
					expanded={panelExpanded}
					className={cx('rcx-box--animated', cxx('rcx-accordion-item__panel')({ expanded: panelExpanded }))}
					id={panelId}
				>
					{children}
				</AccordionItemPanel>
			</AccordionItemFrame>
		</StylingBox>
	);
};

export default withFuselageProvider(AccordionItem);
