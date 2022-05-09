import { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import Card from '../../../components/Card';
import { useRoute } from '../../../contexts/RouterContext';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';

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
		<Card width='full' height='full' backgroundColor='white'>
			<Card.Title>{t(title)}</Card.Title>
			{description && t.has(description) && <Card.Body>{t(description)}</Card.Body>}
			<Card.Footer>
				<Button small onClick={handleOpenGroup}>
					{t('Open')}
				</Button>
			</Card.Footer>
		</Card>
	);
};

export default SettingsGroupCard;
