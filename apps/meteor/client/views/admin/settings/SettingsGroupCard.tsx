import { ISetting } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Card from '../../../components/Card';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	word-break: break-all;
`;

type SettingsGroupCard = {
	id: ISetting['_id'];
	title: TranslationKey;
	description?: TranslationKey;
};

const SettingsGroupCard = ({ id, title, description }: SettingsGroupCard): ReactElement => {
	const t = useTranslation();
	const router = useRoute('admin-settings');

	const handleOpenGroup = useMutableCallback(() => {
		if (id) {
			router.push({
				group: id,
			});
		}
	});

	return (
		<Card borderRadius='x2' pb='x16' pi='x20' width='full' height='full' minHeight='x188' backgroundColor='white'>
			<Card.Title>
				<Box fontScale='h4'>{t(title)}</Box>
			</Card.Title>
			<Box height='x88'>
				{description && t.has(description) && (
					<Card.Body>
						<Box className={clampStyle}>{t(description)}</Box>
					</Card.Body>
				)}
			</Box>
			<Card.Footer>
				<Button small onClick={handleOpenGroup}>
					{t('Open')}
				</Button>
			</Card.Footer>
		</Card>
	);
};

export default SettingsGroupCard;
