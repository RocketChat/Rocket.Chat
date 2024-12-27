import { Button, Chip, FieldRow, TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps, FormEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DepartmentTagsProps = {
	error: string;
	value: string[];
	onChange: (tags: string[]) => void;
} & ComponentProps<typeof TextInput>;

const DepartmentTags = ({ error, value: tags, onChange, ...props }: DepartmentTagsProps) => {
	const { t } = useTranslation();
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
					{...props}
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
			{tags?.length > 0 && (
				<FieldRow>
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

export default DepartmentTags;
