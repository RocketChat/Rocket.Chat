import React from 'react';

import Info from './Info';

const Roles = ({ children }) => (
	<Info rcx-user-card__roles m='neg-x2' flexWrap='wrap' display='flex' flexShrink={0}>
		{children}
	</Info>
);

export default Roles;
