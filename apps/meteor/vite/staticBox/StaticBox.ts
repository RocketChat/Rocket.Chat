import { Box, extractStylingProps, useBoxTransform } from '@rocket.chat/fuselage';
import type { ElementType } from 'react';
import { createElement } from 'react';

type StaticBoxProps = {
	is?: ElementType;
	className?: string;
	__rcxClassName?: string;
	__rcxBoxProps?: Record<string, unknown>;
	__rcxSpread?: boolean;
	htmlSize?: number;
	[prop: string]: unknown;
};

const hasBoxProps = (props: Record<string, unknown>) =>
	Object.keys(extractStylingProps(props)[0]).length !== Object.keys(props).length ||
	Object.keys(props).some((name) => name === 'animated' || name === 'withRichContent' || name === 'focusable' || name.startsWith('rcx-'));

// Renders what `Box` renders for styling and `Box`-only props known at build time; under a `Margins`, `Scrollable` or the like, which
// change the props of the `Box` below them, for a `className` that is not a string, or for spread props that `Box` would
// style, it renders the `Box` itself.
export const StaticBox = ({ is = 'div', className, __rcxClassName, __rcxBoxProps, __rcxSpread, htmlSize, ...props }: StaticBoxProps) => {
	if (useBoxTransform() || (className && typeof className !== 'string') || (__rcxSpread && hasBoxProps(props))) {
		return createElement(Box, { is, className, htmlSize, ...__rcxBoxProps, ...props });
	}

	return createElement(is, {
		...props,
		...(htmlSize ? { size: htmlSize } : {}),
		className: ['rcx-box rcx-box--full', className, __rcxClassName].filter(Boolean).join(' '),
	});
};
