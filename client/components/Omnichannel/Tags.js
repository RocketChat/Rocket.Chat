import React, { useState } from 'react';
import { Field, TextInput, Box, Tag, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const TagsManual = ({ tags = [], handler = () => {} }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();


	const [tagValue, handleTagValue] = useState('');

	const hasDuplicatedTag = (tag) => !!tags.find((tagArray) => tagArray === tag);

	const addTag = (tag) => {
		if (hasDuplicatedTag(tag)) {
			dispatchToastMessage({ type: 'error', message: t('Tag_already_exists') });
			return;
		}
		handler([...tags, tag]);
	};

	const removeTag = (tag) => {
		const tagsFiltered = tags.filter((tagArray) => tagArray !== tag);
		handler(tagsFiltered);
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			tagValue && addTag(tagValue);
			handleTagValue('');
		}
	};


	return <>
		<Field.Row>
			<TextInput onKeyDown={handleKeyDown} value={tagValue} flexGrow={1} onChange={(event) => handleTagValue(event.target.value)}/>
		</Field.Row>
		<Field.Row>
			{tags && <Box color='hint' display='flex' flex-direction='row'>
				{tags.length > 0 && tags.map((tag) => (
					<Box onClick={() => removeTag(tag)} key={tag} mie='x4'>
						<Tag style={{ display: 'inline', fontSize: '0.8rem' }} disabled>
							{tag}
							<Icon style={{ fontWeight: 'bold', paddingTop: '0.1rem', paddingBottom: '0.3rem' }} marginBlockStart='x2' name='cross' />
						</Tag>
					</Box>
				))}
			</Box>}
		</Field.Row>
	</>;
};

export default TagsManual;
