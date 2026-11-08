import { css } from '@rocket.chat/css-in-js';
import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { useStyle } from '../../hooks/useStyle';
import { spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';

export type MarginsProps = PropsWithChildren<{
	all?: BoxProps['margin'];
	block?: BoxProps['marginBlock'];
	blockStart?: BoxProps['marginBlockStart'];
	blockEnd?: BoxProps['marginBlockEnd'];
	inline?: BoxProps['marginInline'];
	inlineStart?: BoxProps['marginInlineStart'];
	inlineEnd?: BoxProps['marginInlineEnd'];
	className?: string;
}>;

/**
 * Add margins to the wrapped component.
 */
const Margins = (props: MarginsProps) => {
	const { children, className, all, block, blockStart, blockEnd, inline, inlineStart, inlineEnd } = props;

	const transformFn = useCallback(
		(props: any) => {
			if (all !== undefined && props.margin === undefined) {
				props.margin = all;
			}

			if (block !== undefined && props.marginBlock === undefined) {
				props.marginBlock = block;
			}

			if (blockStart !== undefined && props.marginBlockStart === undefined) {
				props.marginBlockStart = blockStart;
			}

			if (blockEnd !== undefined && props.marginBlockEnd === undefined) {
				props.marginBlockEnd = blockEnd;
			}

			if (inline !== undefined && props.marginInline === undefined) {
				props.marginInline = inline;
			}

			if (inlineStart !== undefined && props.marginInlineStart === undefined) {
				props.marginInlineStart = inlineStart;
			}

			if (inlineEnd !== undefined && props.marginInlineEnd === undefined) {
				props.marginInlineEnd = inlineEnd;
			}

			return props;
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
