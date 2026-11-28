import { type Key, type ReactNode } from 'react';

export type PartialNode<T> = {
	'type'?: string;
	'key'?: Key;
	'value'?: T;
	'element'?: ReactNode;
	'wrapper'?: (element: ReactNode) => ReactNode;
	'rendered'?: ReactNode;
	'textValue'?: string;
	'aria-label'?: string;
	'index'?: number;
	'renderer'?: (item: T) => ReactNode;
	'hasChildNodes'?: boolean;
	'childNodes'?: () => IterableIterator<PartialNode<T>>;
	'props'?: any;
	'shouldInvalidate'?: (context: unknown) => boolean;
};
