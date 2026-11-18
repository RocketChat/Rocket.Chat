import { css } from '@rocket.chat/css-in-js';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { useStyle } from '../../hooks/useStyle';
import { spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';
import type { BoxTransformProps } from '../Box/BoxTransforms';

export type MarginsProps = {
	children?: ReactNode;
	/** Margin on every side, as a spacing token (`x8`, `neg-x8`), a number of pixels, `auto` or `none`. */
	all?: BoxProps['margin'];
	/** Margin above and below. */
	block?: BoxProps['marginBlock'];
	blockStart?: BoxProps['marginBlockStart'];
	blockEnd?: BoxProps['marginBlockEnd'];
	/** Margin on the start and end sides, which swap in a right-to-left layout. */
	inline?: BoxProps['marginInline'];
	inlineStart?: BoxProps['marginInlineStart'];
	inlineEnd?: BoxProps['marginInlineEnd'];
	/** Class name added to each child, as `Margins` renders no element of its own. */
	className?: string;
};

/**
 * Gives each element it wraps the same margins; a margin set on a wrapped `Box` itself wins. Inside a layout
 * container, prefer a `Stack` and its `gap`: the space between blocks belongs to their parent.
 */
const Margins = (props: MarginsProps) => {
	const { children, className, all, block, blockStart, blockEnd, inline, inlineStart, inlineEnd } = props;

	const transformFn = useCallback(
		(boxProps: BoxTransformProps) => {
			if (all !== undefined && boxProps.margin === undefined) {
				boxProps.margin = all;
			}

			if (block !== undefined && boxProps.marginBlock === undefined) {
				boxProps.marginBlock = block;
			}

			if (blockStart !== undefined && boxProps.marginBlockStart === undefined) {
				boxProps.marginBlockStart = blockStart;
			}

			if (blockEnd !== undefined && boxProps.marginBlockEnd === undefined) {
				boxProps.marginBlockEnd = blockEnd;
			}

			if (inline !== undefined && boxProps.marginInline === undefined) {
				boxProps.marginInline = inline;
			}

			if (inlineStart !== undefined && boxProps.marginInlineStart === undefined) {
				boxProps.marginInlineStart = inlineStart;
			}

			if (inlineEnd !== undefined && boxProps.marginInlineEnd === undefined) {
				boxProps.marginInlineEnd = inlineEnd;
			}

			return boxProps;
		},
		[all, block, blockEnd, blockStart, inline, inlineEnd, inlineStart],
	);

	const marginsClassName = useStyle(
		css`
			&:not(.rcx-box--full) {
				${
					props.all &&
					css`
						margin: ${spacing(props.all)};
					`
				}
				${
					props.inline &&
					css`
						margin-inline: ${spacing(props.inline)};
					`
				}
      ${
					props.inlineStart &&
					css`
						margin-inline-start: ${spacing(props.inlineStart)};
					`
				}
      ${
					props.inlineEnd &&
					css`
						margin-inline-end: ${spacing(props.inlineEnd)};
					`
				}
      ${
					props.block &&
					css`
						margin-block: ${spacing(props.block)};
					`
				}
      ${
					props.blockStart &&
					css`
						margin-block-start: ${spacing(props.blockStart)};
					`
				}
      ${
					props.blockEnd &&
					css`
						margin-block-end: ${spacing(props.blockEnd)};
					`
				}
			}
		`,
		props,
	) as string;

	const patchedChildren = patchChildren(children, (childProps: { className: string | string[]; [index: string]: unknown }) => ({
		className: appendClassName(childProps.className, appendClassName(className, marginsClassName)),
	}));

	return <BoxTransforms.Provider value={useComposedBoxTransform(transformFn)}>{patchedChildren}</BoxTransforms.Provider>;
};

export default Margins;
