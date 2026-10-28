import breakpoints from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import { styled, View, type GetProps } from '@tamagui/web';
import { createContext, useContext, type CSSProperties } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { fontFamily } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** What `rcx-box rcx-box--full` used to give every Grid element. */
export const gridBoxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

type Breakpoint = keyof typeof breakpoints;

const breakpointNames = Object.keys(breakpoints) as Breakpoint[];

/** One value per breakpoint as a Tamagui media clause; `xs` has no query, so its value is the default. */
const perBreakpoint = (value: (breakpoint: Breakpoint) => string | number | undefined) =>
	Object.fromEntries(
		breakpointNames.flatMap((breakpoint) => {
			const v = value(breakpoint);
			return v === undefined ? [] : [[breakpoint === 'xs' ? 'default' : breakpoint, v]];
		}),
	);

export const gutter = (breakpoint: Breakpoint, factor: number) => `${(breakpoints[breakpoint].gutterWidth * factor) / 16}rem`;

/** The breakpoints a `Grid` pins its items to, whatever the viewport width. */
export const GridContext = createContext<Partial<Record<Breakpoint, boolean>>>({});

type Sizing = 'grow' | 'basis' | 'max';

const sizingProperty = (sizing: Sizing, breakpoint: Breakpoint) => `--rcx-grid-item-${sizing}-${breakpoint}` as const;

/** A breakpoint without its own value keeps the one of the narrower breakpoint before it. */
const sizingChain = (sizing: Sizing, breakpoint: Breakpoint, base: string) =>
	breakpointNames
		.slice(0, breakpointNames.indexOf(breakpoint) + 1)
		.reduce((fallback, name) => `var(${sizingProperty(sizing, name)}, ${fallback})`, base);

const GridItemFrame = styled(View, {
	...gridBoxStyle,
	display: 'block',
	flexGrow: perBreakpoint((breakpoint) => sizingChain('grow', breakpoint, '1')),
	flexBasis: perBreakpoint((breakpoint) => sizingChain('basis', breakpoint, '0')),
	maxWidth: perBreakpoint((breakpoint) => sizingChain('max', breakpoint, 'none')),
	paddingBlock: perBreakpoint((breakpoint) => `var(--rcx-grid-item-padding, ${gutter(breakpoint, 1 / 2)})`),
	paddingInline: perBreakpoint((breakpoint) => `var(--rcx-grid-item-padding, ${gutter(breakpoint, 1 / 2)})`),
});

const width = (breakpoint: Breakpoint, columns: number) => `${(columns / breakpoints[breakpoint].columns) * 100}%`;

// A pinned breakpoint beats the viewport, and the widest one pinned wins, as the stylesheet's child selectors did
const useItemStyle = (columnsByBreakpoint: Partial<Record<Breakpoint, number>>) => {
	const pinned = useContext(GridContext);
	const pinnedPadding = breakpointNames.findLast((breakpoint) => pinned[breakpoint]);
	const pinnedColumns = breakpointNames.findLast((breakpoint) => pinned[breakpoint] && columnsByBreakpoint[breakpoint]);

	const style: Record<string, string | number> = {};
	if (pinnedPadding) style['--rcx-grid-item-padding'] = gutter(pinnedPadding, 1 / 2);

	for (const breakpoint of breakpointNames) {
		const columns = pinnedColumns ? columnsByBreakpoint[pinnedColumns] : columnsByBreakpoint[breakpoint];
		if (!columns) continue;
		const w = width(pinnedColumns ?? breakpoint, columns);
		style[sizingProperty('grow', breakpoint)] = 0;
		style[sizingProperty('basis', breakpoint)] = w;
		style[sizingProperty('max', breakpoint)] = w;
	}

	return style;
};

export type GridItemProps = ElementProps<HTMLDivElement> & {
	xs?: 1 | 2 | 3 | 4;
	sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

const GridItem = ({ xs, sm, md, lg, xl, className, style, ...props }: GridItemProps) => {
	const itemStyle = useItemStyle({ xs, sm, md, lg, xl });

	return (
		<GridItemFrame
			style={{ ...itemStyle, ...style } as CSSProperties}
			{...(props as GetProps<typeof GridItemFrame>)}
			className={cx(
				'rcx-grid__item',
				xs && `rcx-grid__item--xs-${xs}`,
				sm && `rcx-grid__item--sm-${sm}`,
				md && `rcx-grid__item--md-${md}`,
				lg && `rcx-grid__item--lg-${lg}`,
				xl && `rcx-grid__item--xl-${xl}`,
				className,
			)}
		/>
	);
};

export default withFuselageProvider(GridItem);
