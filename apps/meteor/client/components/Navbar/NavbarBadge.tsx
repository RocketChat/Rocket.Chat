import { Badge } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

export const NavbarBadge = (props: Omit<AllHTMLAttributes<HTMLSpanElement>, 'is'>) => {
	return (
		<div style={{ top: -5, right: -5, position: 'absolute' }}>
			<Badge {...props} />
		</div>
	);
};
