import { CallStates } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Divider, SidebarFooter as Footer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

import { settings } from '../../../app/settings/client';
import { useCallerStatus, useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';
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

	const t = useTranslation();

	const isEnterpriseEdition = useEndpoint('GET', '/v1/licenses.isEnterprise');
	const { data, isSuccess } = useQuery(['licences'], () => isEnterpriseEdition());
	const isCommunityEdition = isSuccess && !data?.isEnterprise;

	const isCallEnabled = useIsCallEnabled();
	const ready = useIsCallReady();
	const callerStatus = useCallerStatus();

	const activeCallStatus: CallStates[] = ['OFFER_RECEIVED', 'IN_CALL', 'ON_HOLD', 'ANSWER_SENT'];

	if (activeCallStatus.includes(callerStatus) && isCallEnabled && ready) {
		return <VoipFooter />;
	}

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
			{isCommunityEdition && (
				<Box pi='x16' pbe='x8'>
					<Box fontSize='x10' fontWeight={700} color={colors.n600} pbe='x4'>
						<a href='https://rocket.chat/' target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none', color: 'inherit' }}>
							{t('Powered_by_RocketChat')}
						</a>
					</Box>
					<Box fontSize='x10' fontWeight={700} color={colors.n100} pbe='x4'>
						{t('Free_Edition')}
					</Box>
				</Box>
			)}
		</Footer>
	);
};

export default SidebarFooter;
