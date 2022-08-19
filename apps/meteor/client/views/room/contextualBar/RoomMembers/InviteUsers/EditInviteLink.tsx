import { Box, Field, Select, Button, SelectOption } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

type EditInviteLinkProps = {
	daysAndMaxUses: { days: string; maxUses: string };
	onClickNewLink: (daysAndMaxUses: { days: string; maxUses: string }) => void;
};

const EditInviteLink = ({ daysAndMaxUses, onClickNewLink }: EditInviteLinkProps): ReactElement => {
	const t = useTranslation();
	const {
		handleSubmit,
		formState: { isDirty },
		control,
	} = useForm({ defaultValues: { days: daysAndMaxUses.days, maxUses: daysAndMaxUses.maxUses } });

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
				<Field.Label flexGrow={0}>{t('Expiration_(Days)')}</Field.Label>
				<Field.Row>
					<Controller
						name='days'
						control={control}
						render={({ field: { onChange, value, name, ref } }): ReactElement => (
							<Select ref={ref} name={name} value={value} onChange={onChange} options={daysOptions} />
						)}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label flexGrow={0}>{t('Max_number_of_uses')}</Field.Label>
				<Field.Row>
					<Controller
						name='maxUses'
						control={control}
						render={({ field: { onChange, value, name, ref } }): ReactElement => (
							<Select ref={ref} name={name} value={value} onChange={onChange} options={maxUsesOptions} />
						)}
					/>
				</Field.Row>
			</Field>
			<Box mbs='x8'>
				<Button disabled={!isDirty} primary onClick={handleSubmit(onClickNewLink)}>
					{t('Generate_New_Link')}
				</Button>
			</Box>
		</>
	);
};

export default EditInviteLink;
