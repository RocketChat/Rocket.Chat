import { css } from '@rocket.chat/css-in-js';
import { Box, Divider, SidebarFooter as Footer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import React, { ReactElement } from 'react';

import { settings } from '../../../app/settings/client';
import { SidebarFooterWatermark } from '../../../ee/client/sidebar/footer/SidebarFooterWatermark';

const SidebarFooterDefault = (): ReactElement => {
	const sidebarFooterStyle = css`
		& img {
			max-width: 100%;
			height: 100%;
		}

		& a:any-link {
			color: ${colors.n600};
			color: var(--rc-color-primary-light, ${colors.n600});
		}
	`;

	return (
		<Footer>
			<Divider mbs={-2} mbe={0} borderColor={`${colors.n900}40`} />
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
