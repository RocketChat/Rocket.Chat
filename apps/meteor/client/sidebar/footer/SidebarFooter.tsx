import { CallStates } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, SidebarFooter as Footer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect } from 'react';

import { settings } from '../../../app/settings/client';
import { useCallerStatus, useIsCallEnabled, useIsCallReady } from '../../contexts/CallContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../lib/asyncState';
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

	const { value, phase } = useEndpointData('licenses.get');
	const endpointLoading = phase === AsyncStatePhase.LOADING;

	const t = useTranslation();

	const isCallEnabled = useIsCallEnabled();
	const ready = useIsCallReady();
	const callerStatus = useCallerStatus();

	useEffect(() => {
		console.log('callerStatus', callerStatus);
	}, [callerStatus]);

	const activeCallStatus: CallStates[] = ['OFFER_RECEIVED', 'IN_CALL', 'ON_HOLD', 'ANSWER_SENT'];

	if (activeCallStatus.includes(callerStatus) && isCallEnabled && ready) {
		return <VoipFooter />;
	}

	const isCommunityEdition = endpointLoading ? false : value?.licenses?.length === 0;

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
			{isCommunityEdition && (
				<Box pi='x16' pbe='x8'>
					<Box fontSize='x10' fontWeight={700} color='neutral-100' pbe='x4'>
						{t('Community_Edition')}
					</Box>
					<Box fontSize='x10' fontWeight={700} color='neutral-600'>
						{t('Security_Communication_Free')}
					</Box>
				</Box>
			)}
		</Footer>
	);
};

export default SidebarFooter;
