import React from 'react';

const SvgIcon = ({ icon, block = '', baseUrl = '', className }) => <svg
	className={[
		'rc-icon',
		block,
		block && icon && `${ block }--${ icon }`,
		className,
	].filter(Boolean).join(' ')}
	aria-hidden='true'
>
	<use xlinkHref={`${ baseUrl }#icon-${ icon }`} />
</svg>;

const FontIcon = ({ icon, className }) => <i
	className={[icon, className].filter(Boolean).join(' ')}
/>;

export const Icon = ({ icon, ...props }) =>
	(/^icon-/.test(icon)
		? <FontIcon icon={icon} {...props} />
		: <SvgIcon icon={icon} {...props} />);
