import { css } from '@rocket.chat/css-in-js';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React from 'react';

import BreadcrumbsText from './BreadcrumbsText';

const BreadcrumbsLink = (props) => (
	<BreadcrumbsText
		is='a'
		{...props}
		className={[
			css`
				&:hover,
				&:focus {
					color: ${colors.b500} !important;
				}
				&:visited {
					color: ${colors.n800};
				}
			`,
		].filter(Boolean)}
	/>
);

export default BreadcrumbsLink;
