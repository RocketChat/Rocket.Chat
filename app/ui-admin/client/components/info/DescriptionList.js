import React from 'react';

export const DescriptionList = ({ children, ...props }) =>
	<table className='statistics-table secondary-background-color' {...props}>
		<tbody>
			{children}
		</tbody>
	</table>;

const Entry = ({ children, label, ...props }) =>
	<tr className='admin-table-row' {...props}>
		<th className='content-background-color border-component-color'>{label}</th>
		<td className='border-component-color'>{children}</td>
	</tr>;

DescriptionList.Entry = Entry;
