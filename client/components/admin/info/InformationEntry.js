import React from 'react';

export const InformationEntry = ({ children, label }) =>
	<tr className='admin-table-row'>
		<th className='content-background-color border-component-color'>{label}</th>
		<td className='border-component-color'>{children}</td>
	</tr>;
