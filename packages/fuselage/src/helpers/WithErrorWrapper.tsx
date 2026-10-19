import type { Context, ReactNode } from 'react';
import { useContext } from 'react';

type WithErrorWrapperProps<T> = {
	context: Context<T>;
	children: ReactNode;
	componentName: string;
	parentComponent: 'Field';
};

function WithErrorWrapper<T>({ context, componentName, children, parentComponent: parentName }: WithErrorWrapperProps<T>) {
	const isInsideParent = useContext(context);
	if (!isInsideParent) {
		throw new Error(`${componentName} should be used as children of ${parentName} Component`);
	}

	return children;
}

export default WithErrorWrapper;
