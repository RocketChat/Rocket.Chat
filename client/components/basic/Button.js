import React from 'react';

export const Button = ({
	children,
	className,
	invisible,
	primary,
	secondary,
	cancel,
	nude,
	submit,
	...props
}) => <button
	type={(submit && 'submit') || 'button'}
	className={[
		'rc-button',
		primary && 'rc-button--primary',
		secondary && 'rc-button--secondary',
		invisible && 'rc-button--invisible',
		cancel && 'rc-button--cancel',
		nude && 'rc-button--nude',
		className,
	].filter(Boolean).join(' ')}
	{...props}
>
	{children}
</button>;
