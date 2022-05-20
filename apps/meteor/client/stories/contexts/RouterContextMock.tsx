import { RouterContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import React, { ContextType, ReactElement, ReactNode, useContext, useMemo } from 'react';

const logAction = action('RouterContext');

type RouterContextMockProps = {
	children: ReactNode;
};

const RouterContextMock = ({ children }: RouterContextMockProps): ReactElement => {
	const parent = useContext(RouterContext);

	const value = useMemo(
		(): ContextType<typeof RouterContext> => ({
			...parent,
			pushRoute: (name, parameters, queryStringParameters): void => {
				logAction('pushRoute', name, parameters, queryStringParameters);
			},
		}),
		[parent],
	);

	return <RouterContext.Provider children={children} value={value} />;
};

export default RouterContextMock;
