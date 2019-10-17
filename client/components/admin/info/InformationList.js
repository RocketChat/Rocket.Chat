import React from 'react';

export const InformationList = ({ children }) =>
	<table className='statistics-table secondary-background-color'>
		<tbody>
			{children}
		</tbody>
	</table>;
