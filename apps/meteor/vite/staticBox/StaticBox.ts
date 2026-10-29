import { Box, useBoxTransform } from '@rocket.chat/fuselage';
import type { ElementType } from 'react';
import { createElement } from 'react';

type StaticBoxProps = {
	is?: ElementType;
	className?: string;
	__rcxClassName?: string;
	__rcxStylingProps?: Record<string, unknown>;
	[prop: string]: unknown;
};

// Renders what `Box` renders for styling props known at build time; under a `Margins`, `Scrollable` or the like, which
// change the props of the `Box` below them, it renders the `Box` itself.
export const StaticBox = ({ is = 'div', className, __rcxClassName, __rcxStylingProps, ...props }: StaticBoxProps) => {
	if (useBoxTransform()) {
		return createElement(Box, { is, className, ...__rcxStylingProps, ...props });
	}

	return createElement(is, { ...props, className: ['rcx-box rcx-box--full', className, __rcxClassName].filter(Boolean).join(' ') });
};
