import { css } from '@rocket.chat/css-in-js';
import { Box, SidebarDivider, Palette, SidebarFooter as Footer } from '@rocket.chat/fuselage';
// import { useSetting } from '@rocket.chat/ui-contexts';
import { useThemeMode } from '@rocket.chat/ui-theming/src/hooks/useThemeMode';
import type { ReactElement } from 'react';
import React from 'react';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

// import { SidebarFooterWatermark } from '../../../ee/client/sidebar/footer/SidebarFooterWatermark';

const SidebarFooterDefault = (): ReactElement => {
	const [, , theme] = useThemeMode();
	// const logo = String(useSetting(theme === 'dark' ? 'Layout_Sidenav_Footer_Dark' : 'Layout_Sidenav_Footer')).trim();

	const getOrgLogoList = useEndpoint('GET', '/v1/orgDetail.list');
	const resultLogo: any = useQuery(['orgLogo'], () => getOrgLogoList(), {
		keepPreviousData: true,
	});
	const finalLogo = resultLogo?.data?.orgLogo[0].logoUrl;

	const sidebarFooterStyle = css`
		& img {
			max-width: 100%;
			height: 100%;
		}

		& a:any-link {
			color: ${Palette.text['font-info']};
		}
	`;

	const sidebarLogoStyle = {
		height: '75px',
    	padding: '0.6rem',
    	margin: '1rem'
	}

	return (
		<Footer>
			<SidebarDivider />
			{/* <Box
				is='footer'
				pb={12}
				pi={16}
				height='x48'
				width='auto'
				className={sidebarFooterStyle}
				dangerouslySetInnerHTML={{
					__html: logo,
				}}
			/> */}
				
			<img style={sidebarLogoStyle} src={finalLogo} alt="logo" />
			
			{/* <SidebarFooterWatermark /> */}
		</Footer>
	);
};

export default SidebarFooterDefault;
