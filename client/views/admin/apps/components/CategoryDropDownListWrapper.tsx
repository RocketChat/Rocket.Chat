import { Box } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, ComponentProps } from 'react';

import { useOutsideClick } from '../../../../hooks/useOutsideClick';

const options = {
	margin: 8,
};

const CategoryDropDownListWrapper = forwardRef<
	Element,
	ComponentProps<typeof Box> & { onClose: (e: unknown) => void }
>(function CategoryDropDownListWrapper({ children, onClose }, ref) {
	const target = useOutsideClick(onClose);
	const { style } = usePosition(ref as Parameters<typeof usePosition>[0], target as any, options);
	return (
		<Box ref={target} style={style as any} minWidth={224}>
			{children}
		</Box>
	);
});

export default CategoryDropDownListWrapper;
