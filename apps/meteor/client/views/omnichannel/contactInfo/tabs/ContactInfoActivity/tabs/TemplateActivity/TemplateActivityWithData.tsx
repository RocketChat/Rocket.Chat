import { Box, ContextualbarContent, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Throbber } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import TemplateActivity from './TemplateActivity';
import TemplateActivityDialog from './TemplateActivityDialog';
import { mockActivityTemplate } from '../../mocks';

type TemplateActivityWithDataProps = {
	activityId: string;
	onClickBack: () => void;
	onClose: () => void;
};

const TemplateActivityWithData = ({ activityId, onClickBack, onClose }: TemplateActivityWithDataProps) => {
	const { t } = useTranslation();
	const { data, refetch, isPending, isError } = useQuery<typeof mockActivityTemplate>({
		queryKey: ['/v1/omnichannel/outbound/message/activity', activityId],
		queryFn: () => new Promise((res) => setTimeout(() => res(mockActivityTemplate), 2000)),
	});

	if (isPending) {
		return (
			<TemplateActivityDialog onClickBack={onClickBack} onClose={onClose}>
				<ContextualbarContent>
					<Box pb={12}>
						<Throbber size='x12' />
					</Box>
				</ContextualbarContent>
			</TemplateActivityDialog>
		);
	}

	if (isError) {
		return (
			<TemplateActivityDialog onClickBack={onClickBack} onClose={onClose}>
				<ContextualbarContent paddingInline={0} justifyContent='center'>
					<States>
						<StatesIcon name='warning' variation='danger' />
						<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
						<StatesActions>
							<StatesAction onClick={refetch}>{t('Retry')}</StatesAction>
						</StatesActions>
					</States>
				</ContextualbarContent>
			</TemplateActivityDialog>
		);
	}

	return <TemplateActivity data={data} onClickBack={onClickBack} onClose={onClose} />;
};

export default TemplateActivityWithData;
