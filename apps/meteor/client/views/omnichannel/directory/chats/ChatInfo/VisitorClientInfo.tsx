import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import UAParser from 'ua-parser-js';

import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../components/FormSkeleton';

type VisitorClientInfoProps = {
	uid: string;
};

const VisitorClientInfo = ({ uid }: VisitorClientInfoProps) => {
	const { t } = useTranslation();
	const {
		value: userData,
		phase: state,
		error,
	} = useEndpointData('/v1/livechat/visitors.info', { params: useMemo(() => ({ visitorId: uid }), [uid]) });

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !userData || !userData.visitor.userAgent) {
		return null;
	}

	const ua = new UAParser();
	ua.setUA(userData.visitor.userAgent);
	const clientData = {
		os: `${ua.getOS().name} ${ua.getOS().version}`,
		browser: `${ua.getBrowser().name} ${ua.getBrowser().version}`,
		host: userData.visitor.host,
		ip: userData.visitor.ip,
	};

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
