import { Box, Button, Card, CardBody, CardHeader, CardTitle, FramedIcon, Icon, Skeleton, CardControls } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerContent from './SearchAnswerContent';

export type SearchAnswerPanelProps = {
	answer?: string;
	provider?: { name: string; model: string };
	isLoading: boolean;
	error?: unknown;
	disabled: boolean;
	emptyReason: string;
	onRetry: () => void;
};

const SearchAnswerPanel = ({
	answer,
	provider,
	isLoading,
	error,
	disabled,
	emptyReason,
	onRetry,
}: SearchAnswerPanelProps): ReactElement => {
	const { t } = useTranslation();
	const titleId = useId();
	const info = provider ? t('Search_AI_answer_provider', { provider: provider.name, model: provider.model }) : t('Search_AI_overview_info');

	let content: ReactElement;
	if (isLoading) {
		content = (
			<Box display='flex' flexDirection='column' gap={12} aria-busy='true' aria-label={t('Loading')}>
				<Skeleton width='60%' />
				<Skeleton width='100%' />
				<Skeleton width='95%' />
				<Skeleton width='88%' />
				<Skeleton width='72%' />
			</Box>
		);
	} else if (error) {
		content = (
			<Box display='flex' flexDirection='column' alignItems='flex-start' gap={12}>
				<Box color='danger' fontScale='p2'>
					{t('Search_AI_answer_error')}
				</Box>
				<CardControls>
					<Button small onClick={onRetry}>
						{t('Try_again')}
					</Button>
				</CardControls>
			</Box>
		);
	} else if (answer) {
		content = <SearchAnswerContent key={answer} answer={answer} />;
	} else {
		content = (
			<Box color='hint' fontScale='p2'>
				{disabled ? emptyReason : t('Search_AI_answer_ready')}
			</Box>
		);
	}

	return (
		<Box marginBlockEnd={40}>
			<Card role='region' aria-labelledby={titleId}>
				<CardHeader>
					<FramedIcon icon='stars' size={20} />
					<CardTitle id={titleId}>{t('Search_AI_answer')}</CardTitle>
					<Box is='span' display='flex' role='img' title={info} aria-label={info}>
						<Icon name='info-circled' size='x16' color='hint' />
					</Box>
				</CardHeader>
				<CardBody flexDirection='column'>{content}</CardBody>
			</Card>
		</Box>
	);
};

export default SearchAnswerPanel;
