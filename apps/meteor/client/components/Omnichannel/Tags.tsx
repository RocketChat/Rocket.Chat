import { TextInput, Chip, Button, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormSkeleton } from './Skeleton';
import { useLivechatTags } from './hooks/useLivechatTags';
import { CurrentChatTags } from '../../views/omnichannel/additionalForms';

type TagsProps = {
	tags?: string[];
	handler: (value: string[]) => void;
	error?: string;
	tagRequired?: boolean;
	department?: string;
};

const Tags = ({ tags = [], handler, error, tagRequired, department }: TagsProps): ReactElement => {
	const { t } = useTranslation();
	const tagsFieldId = useId();

	const { data: tagsResult, isLoading } = useLivechatTags({
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

	const handleTagTextSubmit = useEffectEvent(() => {
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

	if (isLoading) {
		return <FormSkeleton />;
	}

	return (
		<>
			<FieldLabel htmlFor={tagsFieldId} required={tagRequired} mb={4}>
				{t('Tags')}
			</FieldLabel>

			{tagsResult?.tags && tagsResult?.tags.length ? (
				<FieldRow>
					<CurrentChatTags
						id={tagsFieldId}
						value={paginatedTagValue}
						handler={(tags: { label: string; value: string }[]): void => {
							handler(tags.map((tag) => tag.label));
						}}
						department={department}
						viewAll={!department}
					/>
				</FieldRow>
			) : (
				<>
					<FieldRow>
						<TextInput
							error={error}
							value={tagValue}
							id={tagsFieldId}
							onChange={({ currentTarget }: ChangeEvent<HTMLInputElement>): void => handleTagValue(currentTarget.value)}
							flexGrow={1}
							placeholder={t('Enter_a_tag')}
						/>
						<Button disabled={!tagValue} mis={8} title={t('Add')} onClick={handleTagTextSubmit}>
							{t('Add')}
						</Button>
					</FieldRow>
				</>
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
		</>
	);
};

export default Tags;
