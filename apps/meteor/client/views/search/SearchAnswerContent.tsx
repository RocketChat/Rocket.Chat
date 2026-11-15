import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsOverflowing } from './hooks/useIsOverflowing';
import MarkdownText from '../../components/MarkdownText';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
`;

const linkButtonStyle = css`
	cursor: pointer;
	text-decoration: underline;
	color: ${Palette.text['font-info']};
	border: none;
	background: none;
`;

export type SearchAnswerContentProps = {
	answer: string;
};

const SearchAnswerContent = ({ answer }: SearchAnswerContentProps): ReactElement => {
	const { t } = useTranslation();
	const contentId = useId();
	const [expanded, setExpanded] = useState(false);
	const [ref, isOverflowing] = useIsOverflowing<HTMLDivElement>();

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' gap={8}>
			<Box id={contentId} ref={ref} className={expanded ? undefined : clampStyle}>
				<MarkdownText content={answer} parseEmoji fontScale='p2' />
			</Box>
			{(expanded || isOverflowing) && (
				<Box
					is='button'
					type='button'
					fontScale='p2'
					className={linkButtonStyle}
					aria-expanded={expanded}
					aria-controls={contentId}
					onClick={() => setExpanded((current) => !current)}
				>
					{expanded ? t('Read_less') : t('Read_more')}
				</Box>
			)}
		</Box>
	);
};

export default SearchAnswerContent;
