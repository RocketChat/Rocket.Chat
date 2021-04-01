import React from 'react';
import UAParser from 'ua-parser-js';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const VisitorClientInfo = ({ uid }) => {
	const t = useTranslation();
	const { value: userData, phase: state, error } = useEndpointData(
		`livechat/visitors.info?visitorId=${uid}`,
	);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !userData || !userData.userAgent) {
		return null;
	}

	const clientData = {};
	const ua = new UAParser();
	ua.setUA(userData.userAgent);
	clientData.os = `${ua.getOS().name} ${ua.getOS().version}`;
	clientData.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;

	return (
		<>
			{clientData.os && (
				<>
					<Label>{t('OS')}</Label>
					<Info>{clientData.os}</Info>
				</>
			)}
			{clientData.browser && (
				<>
					<Label>{t('Browser')}</Label>
					<Info>{clientData.browser}</Info>
				</>
			)}
		</>
	);
};

export default VisitorClientInfo;
