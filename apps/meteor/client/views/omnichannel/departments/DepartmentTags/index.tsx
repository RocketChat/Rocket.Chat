import { Button, Chip, FieldRow, FieldHint, TextInput } from '@rocket.chat/fuselage';
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
			<FieldRow>
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
			</FieldRow>

			<FieldHint>{t('Conversation_closing_tags_description')}</FieldHint>

			{tags?.length > 0 && (
				<FieldRow justifyContent='flex-start'>
					{tags.map((tag, i) => (
						<Chip key={i} onClick={handleTagChipClick(tag)} mie={8}>
							{tag}
						</Chip>
					))}
				</FieldRow>
			)}
		</>
	);
};
