import { Box, Button, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../components/MarkdownText';

type SearchAnswerPanelProps = {
	answer?: string;
	provider?: { name: string; model: string };
	isLoading: boolean;
	error?: unknown;
	disabled: boolean;
	emptyReason: string;
	onGenerate: () => void;
};

const SearchAnswerPanel = ({
	answer,
	provider,
	isLoading,
	error,
	disabled,
	emptyReason,
	onGenerate,
}: SearchAnswerPanelProps): ReactElement => {
	const { t } = useTranslation();
	const answerContent = (): ReactElement => {
		if (isLoading) {
			return (
				<Box display='flex' flexDirection='column' gap={12} aria-busy='true' aria-label={t('Loading')}>
					<Skeleton width='60%' />
					<Skeleton width='100%' />
					<Skeleton width='95%' />
					<Skeleton width='88%' />
					<Skeleton width='72%' />
				</Box>
			);
		}

		if (answer) {
			return <MarkdownText content={answer} parseEmoji fontScale='p2' lineHeight={1.55} />;
		}

		return (
			<Box color='hint' fontScale='p2'>
				{disabled ? emptyReason : t('Search_AI_answer_ready')}
			</Box>
		);
	};

	return (
		<Box
			display='flex'
			flexDirection='column'
			mbe={24}
			border='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			borderRadius={4}
			bg='surface-light'
		>
			<Box
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				p={16}
				borderBlockEnd='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
			>
				<Box display='flex' alignItems='center' fontScale='h4' gap={8}>
					<Icon name='stars' size='x18' />
					{t('Search_AI_answer')}
				</Box>
				<Button small disabled={disabled || isLoading} onClick={onGenerate}>
					{isLoading ? t('Loading') : t(answer ? 'Regenerate' : 'Generate')}
				</Button>
			</Box>
			<Box p={16}>
				{provider && (
					<Box color='hint' fontScale='c1' mbe={8}>
						{t('Search_AI_answer_provider', { provider: provider.name, model: provider.model })}
					</Box>
				)}
				{Boolean(error) && (
					<Box color='danger' fontScale='p2'>
						{t('Search_AI_answer_error')}
					</Box>
				)}
				{answerContent()}
			</Box>
		</Box>
	);
};

export default SearchAnswerPanel;
