import React, { useEffect, useRef } from 'react';

import { Icon } from './Icon';

export const Input = ({
	error,
	title,
	icon,
	type = 'text',
	className,
	placeholder,
	options,
	focused,
	...props
}) => {
	const ref = useRef(null);

	useEffect(() => {
		if (focused && ref.current) {
			ref.current.focus();
		}
	}, [focused]);

	return <div
		className={[
			'rc-input',
			error && 'rc-input--error',
		].filter(Boolean).join(' ')}
	>
		<label className='rc-input__label'>
			{title && <div className='rc-input__title'>{title}</div>}
			{['text', 'email', 'password'].includes(type) && <div className='rc-input__wrapper'>
				{icon && <div className='rc-input__icon'>
					<Icon block='rc-input__icon-sv' icon={icon} />
				</div>}<input
					type={type}
					className={['rc-input__element', className].filter(Boolean).join(' ')}
					placeholder={placeholder}
					ref={ref}
					{...props}
				/>
			</div>}
			{type === 'select' && <div className='rc-select'>
				<select
					className={['rc-select__element', className].filter(Boolean).join(' ')}
					ref={ref}
					{...props}
				>
					{placeholder && <option
						disabled
						value=''
					>{placeholder}</option>}
					{options.map(({ label, value }, i) =>
						<option key={i} className='rc-select__option' value={value}>{label}</option>
					)}
				</select>
				<Icon block='rc-select__arrow' icon='arrow-down' />
			</div>}
			{typeof error === 'string' && error && <div className='rc-input__error'>
				<div className='rc-input__error-icon'>
					<Icon block='rc-input__error-icon' icon='warning' className='rc-input__error-icon-svg'/>
				</div>
				<div className='rc-input__error-message'>{error}</div>
			</div>}
		</label>
	</div>;
};
