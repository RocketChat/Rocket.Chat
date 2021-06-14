import React from 'react';

import { useCannedResponses } from './useCannedResponses';

export const withResponseData = (Component) => {
	const WrappedComponent = ({ _id, ...props }) => {
		const response = useCannedResponses(undefined, undefined, _id)?.shift();

		return <Component {...props} response={response} />;
	};

	WrappedComponent.displayName = `withResponseData(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return WrappedComponent;
};
