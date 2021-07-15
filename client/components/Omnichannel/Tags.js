import { Field } from '@rocket.chat/fuselage';
import React, { useState } from 'react';
import { useSubscription } from 'use-subscription';

import { useTranslation } from '../../contexts/TranslationContext';
import { formsSubscription } from '../../views/omnichannel/additionalForms';

const Tags = ({ tags = [], handler = () => {}, tagRequired = false, department }) => {
	const t = useTranslation();
	const forms = useSubscription(formsSubscription);

	const { useCurrentChatTags = () => {} } = forms;
	const CurrentChatTags = useCurrentChatTags();

	const [paginatedTagValue, handlePaginatedTagValue] = useState(tags);

	return (
		<>
			<Field.Label required={tagRequired} mb='x4'>
				{t('Tags')}
			</Field.Label>
			<Field.Row>
				<CurrentChatTags
					value={paginatedTagValue}
					department={department}
					handler={(tags) => {
						handler(tags.map((tag) => tag.label));
						handlePaginatedTagValue(tags);
					}}
				/>
			</Field.Row>
		</>
	);
};

export default Tags;
