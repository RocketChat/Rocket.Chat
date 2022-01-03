import { ActionButton } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef } from 'react';

const CategoryDropDownAnchor = forwardRef<HTMLElement, Partial<ComponentProps<typeof ActionButton>>>(function CategoryDropDownAnchor(
	props,
	ref,
) {
	return <ActionButton ref={ref} icon='doner' {...props} />;
});

export default CategoryDropDownAnchor;
