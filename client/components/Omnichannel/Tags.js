import { Field, TextInput, Chip, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';
import { useSubscription } from 'use-subscription';

import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useEndpointData } from '../../hooks/useEndpointData';
import { formsSubscription } from '../../views/omnichannel/additionalForms';
import { FormSkeleton } from './Skeleton';

const Tags = ({ tags = [], handler = () => {}, error = '', tagRequired = false }) => {
	const { value: tagsResult = [], phase: stateTags } = useEndpointData('livechat/tags.list');
	const t = useTranslation();
	const forms = useSubscription(formsSubscription);

	const { useCurrentChatTags = () => {} } = forms;
	const Tags = useCurrentChatTags();

	const dispatchToastMessage = useToastMessageDispatch();

	const [tagValue, handleTagValue] = useState('');
	const [paginatedTagValue, handlePaginatedTagValue] = useState([]);

	const removeTag = (tag) => {
		const tagsFiltered = tags.filter((tagArray) => tagArray !== tag);
		handler(tagsFiltered);
	};

	const handleTagTextSubmit = useMutableCallback(() => {
		if (!tagValue || tagValue.trim() === '') {
			dispatchToastMessage({ type: 'error', message: t('Enter_a_tag') });
			handleTagValue('');
			return;
		}
		if (tags.includes(tagValue)) {
			dispatchToastMessage({ type: 'error', message: t('Tag_already_exists') });
			return;
		}
		handler([...tags, tagValue]);
		handleTagValue('');
	});

	if ([stateTags].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	const { tags: tagsList } = tagsResult;

	return (
		<>
			<Field.Label required={tagRequired} mb='x4'>
				{t('Tags')}
			</Field.Label>
			{Tags && tagsList && tagsList.length > 0 ? (
				<Field.Row>
					<Tags
						value={paginatedTagValue}
						handler={(tags) => {
							handler(tags.map((tag) => tag.label));
							handlePaginatedTagValue(tags);
						}}
					/>
				</Field.Row>
			) : (
				<>
					<Field.Row>
						<TextInput
							error={error}
							value={tagValue}
							onChange={(event) => handleTagValue(event.target.value)}
							flexGrow={1}
							placeholder={t('Enter_a_tag')}
						/>
						<Button disabled={!tagValue} mis='x8' title={t('add')} onClick={handleTagTextSubmit}>
							{t('Add')}
						</Button>
					</Field.Row>
					<Field.Row justifyContent='flex-start'>
						{tags.map((tag, i) => (
							<Chip key={i} onClick={() => removeTag(tag)} mie='x8'>
								{tag}
							</Chip>
						))}
					</Field.Row>
				</>
			)}
		</>
	);
};

export default Tags;
