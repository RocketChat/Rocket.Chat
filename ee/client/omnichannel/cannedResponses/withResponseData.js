import React from 'react';

import { useCannedResponses } from './useCannedResponses';

export const withResponseData = (WrappedComponent) => ({ _id, ...props }) => {
	const response = useCannedResponses(undefined, undefined, _id)?.shift();

	return <WrappedComponent
		{...props}
		response={response}
	/>;
};
