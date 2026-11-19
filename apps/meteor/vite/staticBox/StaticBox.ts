import { Box, Stack, Text, extractStylingProps, stackHostProps, useBoxTransform } from '@rocket.chat/fuselage';
import type { TextProps } from '@rocket.chat/fuselage';
import type { ElementType } from 'react';
import { createElement } from 'react';

type StaticProps = {
	className?: string;
	__rcxClassName?: string;
	__rcxProps?: Record<string, unknown>;
	__rcxSpread?: boolean;
	[prop: string]: unknown;
};

type StaticBoxProps = StaticProps & { is?: ElementType; htmlSize?: number };

const hasBoxProps = (props: Record<string, unknown>) =>
	Object.keys(extractStylingProps(props)[0]).length !== Object.keys(props).length ||
	Object.keys(props).some((name) => name === 'animated' || name === 'withRichContent' || name === 'focusable' || name.startsWith('rcx-'));

// Renders what `Box` renders for styling and `Box`-only props known at build time; under a `Margins`, `Scrollable` or the like, which
// change the props of the `Box` below them, for a `className` that is not a string, or for spread props that `Box` would
// style, it renders the `Box` itself.
export const StaticBox = ({ is = 'div', className, __rcxClassName, __rcxProps, __rcxSpread, htmlSize, ...props }: StaticBoxProps) => {
	if (useBoxTransform() || (className && typeof className !== 'string') || (__rcxSpread && hasBoxProps(props))) {
		return createElement(Box, { is, className, htmlSize, ...__rcxProps, ...props });
	}

	return createElement(is, {
		...props,
		...(htmlSize ? { size: htmlSize } : {}),
		className: ['rcx-box rcx-box--full', className, __rcxClassName].filter(Boolean).join(' '),
	});
};

const stackProps = ['direction', 'gap', 'align', 'justify', 'wrap', 'grow'];

type StaticStackProps = StaticProps & { is?: 'div' | 'section' | 'ul' | 'li' | 'form' | 'fieldset' | 'span' };

// Renders what `Stack` renders for props known at build time; under a `Margins` or the like, or for spread props that `Stack`
// would style, it renders the `Stack` itself.
export const StaticStack = ({ is = 'div', className, __rcxClassName, __rcxProps, __rcxSpread, ...props }: StaticStackProps) => {
	if (
		useBoxTransform() ||
		(className && typeof className !== 'string') ||
		(__rcxSpread && (hasBoxProps(props) || stackProps.some((name) => name in props)))
	) {
		return createElement(Stack, { is, className, ...__rcxProps, ...props });
	}

	const host = stackHostProps(is);

	return createElement(is, {
		role: host.role,
		...props,
		className: ['rcx-box rcx-box--full', host.className, className, __rcxClassName].filter(Boolean).join(' '),
	});
};

type StaticTextProps = StaticProps & { is?: TextProps['is'] };

const textProps = ['fontScale', 'color', 'truncate'];

// Renders what `Text` renders for props known at build time; for spread props that set them, it renders the `Text` itself.
export const StaticText = ({ is = 'div', className, __rcxClassName, __rcxProps, __rcxSpread, ...props }: StaticTextProps) => {
	if (__rcxSpread && textProps.some((name) => name in props)) {
		return createElement(Text, { is, className, ...__rcxProps, ...props });
	}

	return createElement(is, { ...props, className: [__rcxClassName, className].filter(Boolean).join(' ') });
};
