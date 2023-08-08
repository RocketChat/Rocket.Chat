import { Button, Chip, Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import React, { useCallback, useState } from 'react';

type DepartmentTagsProps = {
	error: string;
	value: string[];
	onChange: (tags: string[]) => void;
};

export const DepartmentTags = ({ error, value: tags, onChange }: DepartmentTagsProps) => {
	const t = useTranslation();
	const [tagText, setTagText] = useState('');

	const handleAddTag = useCallback(() => {
		if (tags.includes(tagText)) {
			return;
		}

		setTagText('');
		onChange([...tags, tagText]);
	}, [onChange, tagText, tags]);

	const handleTagChipClick = (tag: string) => () => {
		onChange(tags.filter((_tag) => _tag !== tag));
	};

	return (
		<>
			<Field.Row>
				<TextInput
					data-qa='DepartmentEditTextInput-ConversationClosingTags'
					error={error}
					placeholder={t('Enter_a_tag')}
					value={tagText}
					onChange={(e: FormEvent<HTMLInputElement>) => setTagText(e.currentTarget.value)}
				/>
				<Button
					disabled={Boolean(!tagText.trim()) || tags.includes(tagText)}
					data-qa='DepartmentEditAddButton-ConversationClosingTags'
					mis={8}
					title={t('Add')}
					onClick={handleAddTag}
				>
					{t('Add')}
				</Button>
			</Field.Row>

			<Field.Hint>{t('Conversation_closing_tags_description')}</Field.Hint>

			{tags?.length > 0 && (
				<Field.Row justifyContent='flex-start'>
					{tags.map((tag, i) => (
						<Chip key={i} onClick={handleTagChipClick(tag)} mie={8}>
							{tag}
						</Chip>
					))}
				</Field.Row>
			)}
		</>
	);
};
