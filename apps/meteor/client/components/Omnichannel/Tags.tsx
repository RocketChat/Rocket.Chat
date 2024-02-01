import { TextInput, Chip, Button, FieldLabel, FieldRow, Field, FieldError } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import { CurrentChatTags } from '../../views/omnichannel/additionalForms';
import { FormSkeleton } from './Skeleton';
import { useLivechatTags } from './hooks/useLivechatTags';

type TagsProps = {
	tags?: string[];
	handler: (value: string[]) => void;
	error?: string;
	required?: boolean;
	department?: string;
};

const Tags = ({ tags = [], handler, error, required = false, department }: TagsProps): ReactElement => {
	const t = useTranslation();

	const { data: tagsResult, isInitialLoading } = useLivechatTags({
		department,
		viewAll: !department,
	});

	const customTags = useMemo(() => {
		return tags.filter((tag) => !tagsResult?.tags.find((rtag) => rtag.name === tag));
	}, [tags, tagsResult?.tags]);

	const dispatchToastMessage = useToastMessageDispatch();

	const [tagValue, handleTagValue] = useState('');

	const paginatedTagValue = useMemo(() => tags.map((tag) => ({ label: tag, value: tag })), [tags]);

	const removeTag = (tagToRemove: string): void => {
		if (!tags) return;

		handler(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleTagTextSubmit = useMutableCallback(() => {
		if (!tags) {
			return;
		}

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

	if (isInitialLoading) {
		return <FormSkeleton />;
	}

	return (
		<Field>
			<FieldLabel required={required} mb={4}>
				{t('Tags')}
			</FieldLabel>

			{tagsResult?.tags && tagsResult?.tags.length ? (
				<FieldRow>
					<CurrentChatTags
						value={paginatedTagValue}
						department={department}
						viewAll={!department}
						error={Boolean(error)}
						handler={(tags: { label: string; value: string }[]): void => {
							handler(tags.map((tag) => tag.label));
						}}
					/>
				</FieldRow>
			) : (
				<FieldRow>
					<TextInput
						error={error}
						value={tagValue}
						flexGrow={1}
						placeholder={t('Enter_a_tag')}
						onChange={({ currentTarget }: ChangeEvent<HTMLInputElement>): void => handleTagValue(currentTarget.value)}
					/>
					<Button disabled={!tagValue} mis={8} title={t('Add')} onClick={handleTagTextSubmit}>
						{t('Add')}
					</Button>
				</FieldRow>
			)}

			{customTags.length > 0 && (
				<FieldRow justifyContent='flex-start'>
					{customTags?.map((tag, i) => (
						<Chip key={i} onClick={(): void => removeTag(tag)} mie={8}>
							{tag}
						</Chip>
					))}
				</FieldRow>
			)}

			{error && <FieldError>{error}</FieldError>}
		</Field>
	);
};

export default Tags;
