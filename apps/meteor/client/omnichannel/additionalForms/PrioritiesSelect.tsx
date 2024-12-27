import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Options, Box, Option, Field, FieldLabel, FieldRow, SelectLegacy } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useCallback, forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { PriorityIcon } from '../priorities/PriorityIcon';

type PrioritiesSelectProps = {
	value: string;
	label: string;
	options: Serialized<ILivechatPriority[]>;
	onChange: (value: string) => void;
};

export const PrioritiesSelect = ({ value = '', label, options, onChange }: PrioritiesSelectProps) => {
	const { t } = useTranslation();
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const [sorting] = useState<Record<string, LivechatPriorityWeight>>({});

	const formattedOptions = useMemo<SelectOption[]>(() => {
		const opts: SelectOption[] = options?.map(({ dirty, name, i18n, _id, sortItem }) => {
			const label = dirty && name ? name : t(i18n as TranslationKey);
			sorting[_id] = sortItem;
			return [_id, label];
		});
		return [['', t('Unprioritized')], ...opts];
	}, [options, sorting, t]);

	const renderOption = useCallback(
		(label: string, value: string) => {
			return (
				<>
					<PriorityIcon level={sorting[value] || LivechatPriorityWeight.NOT_SPECIFIED} showUnprioritized /> {label}
				</>
			);
		},
		[sorting],
	);

	// eslint-disable-next-line react/no-multi-comp
	const renderOptions = forwardRef<HTMLElement, ComponentProps<typeof Options>>(function OptionsWrapper(props, ref) {
		return <Options ref={ref} {...props} maxHeight={200} />;
	});

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<FieldRow>
				<SelectLegacy
					value={value}
					onChange={onChange}
					options={formattedOptions}
					renderOptions={renderOptions}
					renderSelected={({ label, value }) => <Box flexGrow='1'>{renderOption(label, value)}</Box>}
					renderItem={({ label, value, ...props }) => <Option {...props} label={renderOption(label, value)} />}
				/>
			</FieldRow>
		</Field>
	);
};

export default PrioritiesSelect;
