import { Field, TextInput, Chip, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import { useFormsSubscription } from '../../views/omnichannel/additionalForms';
import { FormSkeleton } from './Skeleton';
import { useLivechatTags } from './hooks/useLivechatTags';

type TagsProps = {
	tags?: string[];
	handler: (value: string[]) => void;
	error?: string;
	tagRequired?: boolean;
	department?: string;
};

const Tags = ({ tags = [], handler, error, tagRequired, department }: TagsProps): ReactElement => {
	const t = useTranslation();
	const forms = useFormsSubscription() as any;

	// TODO: Refactor the formsSubscription to use components instead of hooks (since the only thing the hook does is return a component)
	const { useCurrentChatTags } = forms;
	// Conditional hook was required since the whole formSubscription uses hooks in an incorrect manner
	const EETagsComponent = useCurrentChatTags?.();

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
		<>
			<Field.Label required={tagRequired} mb={4}>
				{t('Tags')}
			</Field.Label>

			{EETagsComponent && tagsResult?.tags && tagsResult?.tags.length ? (
				<Field.Row>
					<EETagsComponent
						value={paginatedTagValue}
						handler={(tags: { label: string; value: string }[]): void => {
							handler(tags.map((tag) => tag.label));
						}}
						department={department}
						viewAll={!department}
					/>
				</Field.Row>
			) : (
				<>
					<Field.Row>
						<TextInput
							error={error}
							value={tagValue}
							onChange={({ currentTarget }: ChangeEvent<HTMLInputElement>): void => handleTagValue(currentTarget.value)}
							flexGrow={1}
							placeholder={t('Enter_a_tag')}
						/>
						<Button disabled={!tagValue} mis={8} title={t('Add')} onClick={handleTagTextSubmit}>
							{t('Add')}
						</Button>
					</Field.Row>
				</>
			)}

			{customTags.length > 0 && (
				<Field.Row justifyContent='flex-start'>
					{customTags?.map((tag, i) => (
						<Chip key={i} onClick={(): void => removeTag(tag)} mie={8}>
							{tag}
						</Chip>
					))}
				</Field.Row>
			)}
		</>
	);
};

export default Tags;
