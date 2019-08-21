import React from 'react';

export const Icon = ({ icon, block = '', baseUrl = '', className }) => <svg
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
