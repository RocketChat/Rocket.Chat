import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import UAParser from 'ua-parser-js';

import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

const VisitorClientInfo = ({ uid }) => {
	const t = useTranslation();
	const { value: userData, phase: state, error } = useEndpointData(`livechat/visitors.info?visitorId=${uid}`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !userData || !userData.visitor.userAgent) {
		return null;
	}

	const clientData = {};
	const ua = new UAParser();
	ua.setUA(userData.visitor.userAgent);
	clientData.os = `${ua.getOS().name} ${ua.getOS().version}`;
	clientData.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
	clientData.host = userData.visitor.host;
	clientData.ip = userData.visitor.ip;

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
			{clientData.host && (
				<Field>
					<Label>{t('Host')}</Label>
					<Info>{clientData.host}</Info>
				</Field>
			)}
			{clientData.ip && (
				<Field>
					<Label>{t('IP')}</Label>
					<Info>{clientData.ip}</Info>
				</Field>
			)}
		</>
	);
};

export default VisitorClientInfo;
