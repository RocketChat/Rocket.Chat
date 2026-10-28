import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select, Button } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import InviteLinkAction from './layout/InviteLinkAction';

export type EditInviteLinkProps = {
	daysAndMaxUses: { days: string; maxUses: string };
	onClickNewLink: (daysAndMaxUses: { days: string; maxUses: string }) => void;
};

const EditInviteLink = ({ daysAndMaxUses, onClickNewLink }: EditInviteLinkProps) => {
	const { t } = useTranslation();
	const {
		handleSubmit,
		formState: { isDirty, isSubmitting },
		control,
	} = useForm({ defaultValues: { days: daysAndMaxUses.days, maxUses: daysAndMaxUses.maxUses } });
	const expirationId = useId();
	const maxUsesId = useId();

	const daysOptions: SelectOption[] = useMemo(
		() => [
			['1', '1'],
			['7', '7'],
			['15', '15'],
			['30', '30'],
			['0', t('Never')],
		],
		[t],
	);

	const maxUsesOptions: SelectOption[] = useMemo(
		() => [
			['5', '5'],
			['10', '10'],
			['25', '25'],
			['50', '50'],
			['100', '100'],
			['0', t('No_Limit')],
		],
		[t],
	);

	return (
		<>
			<Field>
				<FieldLabel htmlFor={expirationId}>{t('Expiration_(Days)')}</FieldLabel>
				<FieldRow>
					<Controller
						name='days'
						control={control}
						render={({ field: { onChange, value, name } }) => (
							<Select id={expirationId} name={name} value={value} onChange={onChange} options={daysOptions} />
						)}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor={maxUsesId}>{t('Max_number_of_uses')}</FieldLabel>
				<FieldRow>
					<Controller
						name='maxUses'
						control={control}
						render={({ field: { onChange, value, name } }) => (
							<Select id={maxUsesId} name={name} value={value} onChange={onChange} options={maxUsesOptions} />
						)}
					/>
				</FieldRow>
			</Field>
			<InviteLinkAction>
				<Button loading={isSubmitting} disabled={!isDirty} variant='primary' onClick={handleSubmit(onClickNewLink)}>
					{t('Generate_New_Link')}
				</Button>
			</InviteLinkAction>
		</>
	);
};

export default EditInviteLink;
