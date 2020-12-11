import React from 'react';

export const withPreventPropagation = (element: JSX.Element): JSX.Element => {
	const preventClickPropagation = (e: React.MouseEvent<HTMLInputElement>): void => e.stopPropagation();

	return <div onClick={preventClickPropagation}>{element}</div>;
};
