import React from 'react';
import './ErrorAlert.css';

export function ErrorAlert({ children, title }) {
	return <div className='ErrorAlert'>
		<div className='ErrorAlert__title'>{title}</div>
		{children}
	</div>;
}
