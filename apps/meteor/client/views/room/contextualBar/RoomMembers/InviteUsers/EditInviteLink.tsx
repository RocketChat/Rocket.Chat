import { Box, Field, Select, Button, InputBox, SelectOption } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo, useState } from 'react';

type EditInviteLinkProps = {
	daysAndMaxUses: { days: string; maxUses: string };
	onClickNewLink: (daysAndMaxUses: { days: string; maxUses: string }) => void;
};

const EditInviteLink = ({ daysAndMaxUses: { days, maxUses }, onClickNewLink }: EditInviteLinkProps): ReactElement => {
	const t = useTranslation();
	const [daysAndMaxUses, setDaysAndMaxUses] = useState({ days, maxUses });

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
					{!daysAndMaxUses.days && <InputBox.Skeleton />}
					{daysAndMaxUses.days && (
						<Select
							value={daysAndMaxUses.days}
							onChange={(value): void => setDaysAndMaxUses((prevState) => ({ ...prevState, days: value }))}
							options={daysOptions}
						/>
					)}
				</Field.Row>
			</Field>
			<Field>
				<Field.Label flexGrow={0}>{t('Max_number_of_uses')}</Field.Label>
				<Field.Row>
					{!daysAndMaxUses.maxUses && <InputBox.Skeleton />}
					{daysAndMaxUses.maxUses && (
						<Select
							value={daysAndMaxUses.maxUses}
							onChange={(value): void => setDaysAndMaxUses((prevState) => ({ ...prevState, maxUses: value }))}
							options={maxUsesOptions}
						/>
					)}
				</Field.Row>
			</Field>
			<Box mbs='x8'>
				<Button primary onClick={(): void => onClickNewLink(daysAndMaxUses)}>
					{t('Generate_New_Link')}
				</Button>
			</Box>
		</>
	);
};

export default EditInviteLink;
