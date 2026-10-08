import { MAX_LABEL_NAME_LENGTH } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, MultiSelectFiltered } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import LabelSelectChip from '../components/LabelSelectChip';
import LabelSelectOption from '../components/LabelSelectOption';
import type { LabelSelectOptionMeta } from '../components/LabelSelectOptionsContext';
import { LabelSelectOptionsContext } from '../components/LabelSelectOptionsContext';
import { useCreateLabel, useSetSubscriptionLabels } from '../hooks/useLabelMutations';
import { useSubscriptionLabels } from '../hooks/useSidebarFiltersPreferences';
import { LABEL_COLOR_TOKENS } from '../lib/labelColors';

// Labels typed in the field are only created on save, so until then they are kept as `new:<name>` values.
const PENDING_PREFIX = 'new:';

const isPending = (value: string) => value.startsWith(PENDING_PREFIX);

const pendingName = (value: string) => value.slice(PENDING_PREFIX.length);

type SubscriptionLabelsModalProps = {
	rid: string;
	onClose: () => void;
};

const SubscriptionLabelsModal = ({ rid, onClose }: SubscriptionLabelsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const subscription = useUserSubscription(rid);
	const labels = useSubscriptionLabels();
	const createLabel = useCreateLabel();
	const setSubscriptionLabels = useSetSubscriptionLabels();
	const [filter, setFilter] = useState('');

	const {
		handleSubmit,
		control,
		watch,
		formState: { isSubmitting },
	} = useForm({
		mode: 'onSubmit',
		defaultValues: {
			labelIds: (subscription?.labels ?? []).filter((labelId) => labels.some(({ _id }) => _id === labelId)),
		},
	});

	const selected = watch('labelIds');

	const optionMeta = useMemo(
		() =>
			new Map<string, LabelSelectOptionMeta>(
				labels.map(({ _id, icon, color }) => [_id, { icon, color: LABEL_COLOR_TOKENS[color] }] as const),
			),
		[labels],
	);

	const options = useMemo((): [string, string][] => {
		const labelOptions = labels.map(({ _id, name }): [string, string] => [_id, name]);
		const pendingOptions = selected.filter(isPending).map((value): [string, string] => [value, pendingName(value)]);

		const typed = filter.trim();
		const knownNames = [...labels.map(({ name }) => name), ...pendingOptions.map(([, name]) => name)].map((name) =>
			name.trim().toLowerCase(),
		);
		const canCreate = typed.length > 0 && typed.length <= MAX_LABEL_NAME_LENGTH && !knownNames.includes(typed.toLowerCase());

		return [
			...(canCreate ? [[`${PENDING_PREFIX}${typed}`, t('Create_label_name', { name: typed })] as [string, string]] : []),
			...labelOptions,
			...pendingOptions,
		];
	}, [filter, labels, selected, t]);

	const handleSave = async ({ labelIds }: { labelIds: string[] }) => {
		try {
			const resolvedIds: string[] = [];
			for (const value of labelIds) {
				if (!isPending(value)) {
					resolvedIds.push(value);
					continue;
				}
				// Sequential, so the server's limit and duplicate checks see each label created before the next one.

				const { label } = await createLabel.mutateAsync({ name: pendingName(value) });
				resolvedIds.push(label._id);
			}

			await setSubscriptionLabels.mutateAsync({ roomId: rid, labelIds: resolvedIds });
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onClose();
		} catch {
			// The mutations already reported the error.
		}
	};

	return (
		<GenericModal
			title={t('Labels')}
			variant='warning'
			icon={null}
			confirmText={t('Save')}
			confirmLoading={isSubmitting}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleSave)} {...props} />}
		>
			<LabelSelectOptionsContext.Provider value={optionMeta}>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Labels')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='labelIds'
								render={({ field: { value, onChange } }) => (
									<MultiSelectFiltered
										value={value}
										onChange={(next) => {
											onChange(next);
											setFilter('');
										}}
										filter={filter}
										setFilter={setFilter}
										options={options}
										placeholder={t('Search_or_create_label')}
										renderItem={LabelSelectOption}
										renderSelected={LabelSelectChip}
									/>
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</LabelSelectOptionsContext.Provider>
		</GenericModal>
	);
};

export default SubscriptionLabelsModal;
