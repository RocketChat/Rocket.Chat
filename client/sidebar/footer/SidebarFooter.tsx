import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { settings } from '../../../app/settings/client';

const SidebarFooter = (): ReactElement => {
	const sidebarFooterStyle = css`
		width: auto;
		height: var(--sidebar-footer-height);
		padding: var(--sidebar-extra-small-default-padding) var(--sidebar-default-padding);

		& img {
			max-width: 100%;
			height: 100%;
		}

		& a:any-link {
			color: var(--rc-color-primary-light);
		}
	`;

	return (
		<Box
			is='footer'
			className={sidebarFooterStyle}
			dangerouslySetInnerHTML={{ __html: String(settings.get('Layout_Sidenav_Footer')).trim() }}
		/>
	);
};

export default SidebarFooter;
