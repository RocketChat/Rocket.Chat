import React from 'react';

export const DescriptionList = ({ children }) =>
	<table className='statistics-table secondary-background-color'>
		<tbody>
			{children}
		</tbody>
	</table>;

const Entry = ({ children, label }) =>
	<tr className='admin-table-row'>
		<th className='content-background-color border-component-color'>{label}</th>
		<td className='border-component-color'>{children}</td>
	</tr>;

DescriptionList.Entry = Entry;
