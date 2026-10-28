import { Box, Button, Chip, FieldRow, TextInput, Stack } from '@rocket.chat/fuselage';
import type { ComponentProps, ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type DepartmentTagsProps = {
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
				<Stack direction='row' align='center' justify='space-between' grow gap={8}>
					<TextInput
						error={error}
						placeholder={t('Enter_a_tag')}
						value={tagText}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setTagText(e.currentTarget.value)}
						{...props}
					/>
					<Button disabled={Boolean(!tagText.trim()) || tags.includes(tagText)} title={t('Add')} onClick={handleAddTag}>
						{t('Add')}
					</Button>
				</Stack>
			</FieldRow>
			{tags?.length > 0 && (
				<FieldRow>
					<Box display='flex' alignItems='center' minWidth={0} gap={8} paddingInlineEnd={8}>
						{tags.map((tag, i) => (
							<Chip key={i} onClick={handleTagChipClick(tag)}>
								{tag}
							</Chip>
						))}
					</Box>
				</FieldRow>
			)}
		</>
	);
};

export default DepartmentTags;
