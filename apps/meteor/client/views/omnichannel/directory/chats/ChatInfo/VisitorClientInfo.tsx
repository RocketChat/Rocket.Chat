import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import UAParser from 'ua-parser-js';

import { omnichannelQueryKeys } from '../../../../../lib/queryKeys';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../components/FormSkeleton';

type VisitorClientInfoProps = {
	uid: string;
};

const VisitorClientInfo = ({ uid }: VisitorClientInfoProps) => {
	const { t } = useTranslation();
	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');
	const {
		isPending,
		isError,
		data: visitor,
	} = useQuery({
		queryKey: omnichannelQueryKeys.visitorInfo(uid),
		queryFn: async () => {
			const { visitor } = await getVisitorInfo({ visitorId: uid });
			return visitor;
		},
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError || !visitor.userAgent) {
		return null;
	}

	const ua = new UAParser();
	ua.setUA(visitor.userAgent);
	const clientData = {
		os: `${ua.getOS().name} ${ua.getOS().version}`,
		browser: `${ua.getBrowser().name} ${ua.getBrowser().version}`,
		host: visitor.host,
		ip: visitor.ip,
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
