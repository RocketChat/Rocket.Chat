import React from 'react';
import UAParser from 'ua-parser-js';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

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
				<Field>
					<Label>{t('OS')}</Label>
					<Info>{clientData.os}</Info>
				</Field>
			)}
			{clientData.browser && (
				<Field>
					<Label>{t('Browser')}</Label>
					<Info>{clientData.browser}</Info>
				</Field>
			)}
		</>
	);
};

export default VisitorClientInfo;
