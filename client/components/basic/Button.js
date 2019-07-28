import React from 'react';

export const Button = ({
	children,
	className,
	invisible,
	primary,
	secondary,
	submit,
	...props
}) => <button
	type={(submit && 'submit') || 'button'}
	className={[
		'rc-button',
		primary && 'rc-button--primary',
		secondary && 'rc-button--secondary',
		invisible && 'rc-button--invisible',
		className,
	].filter(Boolean).join(' ')}
	{...props}
>
	{children}
</button>;
