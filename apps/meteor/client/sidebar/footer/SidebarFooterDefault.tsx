import { css } from '@rocket.chat/css-in-js';
import { Box, SidebarDivider, Palette, SidebarFooter as Footer } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { settings } from '../../../app/settings/client';
import { SidebarFooterWatermark } from '../../../ee/client/sidebar/footer/SidebarFooterWatermark';

const SidebarFooterDefault = (): ReactElement => {
	const sidebarFooterStyle = css`
		& img {
			max-width: 100%;
			height: 100%;
		}

		& a:any-link {
			color: ${Palette.text['font-on-info']};
		}
	`;

	return (
		<Footer>
			<SidebarDivider />
			<Box
				is='footer'
				pb='x12'
				pi='x16'
				height='x48'
				width='auto'
				className={sidebarFooterStyle}
				dangerouslySetInnerHTML={{ __html: String(settings.get('Layout_Sidenav_Footer')).trim() }}
			/>
			<SidebarFooterWatermark />
		</Footer>
	);
};

export default SidebarFooterDefault;
