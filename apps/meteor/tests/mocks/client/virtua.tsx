import type { CSSProperties, ElementType, Ref, ReactNode } from 'react';
import { Children, forwardRef, isValidElement, useImperativeHandle } from 'react';

export const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	scrollTo: jest.fn(),
	findItemIndex: jest.fn((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
};

type MockVirtualizerProps = {
	children: ReactNode;
	bufferSize?: number;
	onScroll?: (offset: number) => void;
	as?: ElementType;
	item?: ElementType;
	style?: CSSProperties;
	className?: string;
	shift?: boolean;
	[key: string]: unknown;
};

export const Virtualizer = forwardRef(function MockVirtualizer(
	{
		children,
		bufferSize,
		onScroll,
		as: asRoot = 'div',
		item: asItem = 'div',
		style,
		className,
		shift: _shift,
		...props
	}: MockVirtualizerProps,
	ref: Ref<unknown>,
) {
	useImperativeHandle(ref, () => mockVirtualizerHandle);
	const Root = asRoot;
	const Item = asItem;
	const wrapped = Children.map(children, (child, index) => {
		const key = isValidElement(child) && child.key != null ? String(child.key) : `row-${index}`;
		return <Item key={key}>{child}</Item>;
	});

	return (
		<Root
			className={className}
			data-buffer-size={bufferSize}
			style={style ?? { height: '100%' }}
			onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)}
			{...props}
		>
			{wrapped}
		</Root>
	);
});

type MockVListProps = {
	children: ReactNode;
	onScroll?: (offset: number) => void;
	shift?: boolean;
	keepMounted?: boolean[];
	[key: string]: unknown;
};

// eslint-disable-next-line react/no-multi-comp
export const VList = forwardRef(function MockVList(
	{ children, onScroll, shift: _shift, keepMounted: _keepMounted, ...props }: MockVListProps,
	ref: Ref<unknown>,
) {
	useImperativeHandle(ref, () => mockVirtualizerHandle);
	return (
		<div onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
			{children}
		</div>
	);
});
