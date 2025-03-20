import type { ISetting } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Box, Card, CardTitle, CardBody, CardControls } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../components/MarkdownText';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;
`;

type SettingsGroupCardProps = {
	id: ISetting['_id'];
	title: TranslationKey;
	description?: TranslationKey;
};

const SettingsGroupCard = ({ id, title, description, ...props }: SettingsGroupCardProps): ReactElement => {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const cardId = useId();
	const descriptionId = useId();

	return (
		<Card data-qa-id={id} aria-labelledby={cardId} aria-describedby={descriptionId} {...props} height='full' role='region'>
			<CardTitle id={cardId}>{t(title)}</CardTitle>
			<CardBody>
				<Box className={clampStyle} id={descriptionId}>
					{description && i18n.exists(description) && <MarkdownText variant='inlineWithoutBreaks' content={t(description)} />}
				</Box>
			</CardBody>
			<CardControls>
				<Button
					is='a'
					href={router.buildRoutePath({
						pattern: '/admin/settings/:group?',
						params: { group: id },
					})}
					medium
				>
					{t('Open')}
				</Button>
			</CardControls>
		</Card>
	);
};

export default SettingsGroupCard;
