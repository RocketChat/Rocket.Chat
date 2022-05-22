import { css } from '@rocket.chat/css-in-js';
import { Box, SidebarFooter as Footer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import React, { ReactElement } from 'react';

import { settings } from '../../../app/settings/client';
import { useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';
import { VoipFooter } from './voip';

const SidebarFooter = (): ReactElement => {
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

	const isCallEnabled = useIsCallEnabled();
	const ready = useIsCallReady();

	if (isCallEnabled && ready) {
		return <VoipFooter />;
	}

	return (
		<Footer>
			<Box
				is='footer'
				pb='x12'
				pi='x16'
				height='x48'
				width='auto'
				className={sidebarFooterStyle}
				dangerouslySetInnerHTML={{ __html: String(settings.get('Layout_Sidenav_Footer')).trim() }}
			/>
		</Footer>
	);
};

export default SidebarFooter;
