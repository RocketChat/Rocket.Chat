import React from 'react';

export const Button = ({ children, className, primary, secondary, submit, ...props }) => <button
	{...submit && { type: 'submit' }}
	className={[
		'rc-button',
		primary && 'rc-button--primary',
		secondary && 'rc-button--secondary',
		className,
	].filter(Boolean).join(' ')}
	{...props}
>
	{children}
</button>;
