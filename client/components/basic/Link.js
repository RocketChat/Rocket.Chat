import React from 'react';

export function Link({ external, ...props }) {
	return <a
		{...external ? {
			rel: 'noopener noreferrer',
			target: '_blank',
		} : {}}
		{...props}
	/>;
}
