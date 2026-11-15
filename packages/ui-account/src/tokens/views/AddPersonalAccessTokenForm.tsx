import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, TextInput, Button, Margins, Select, FieldError, FieldGroup, Field, FieldRow } from '@rocket.chat/fuselage';
import { useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { NewPersonalAccessToken } from '../logic/personalAccessTokens';
import { isValidTokenName } from '../logic/personalAccessTokens';

type AddPersonalAccessTokenFormData = {
	name: string;
	bypassTwoFactor: 'require' | 'bypass';
};

type AddPersonalAccessTokenFormProps = {
	onCreate: (token: NewPersonalAccessToken) => Promise<boolean>;
};

const AddPersonalAccessTokenForm = ({ onCreate }: AddPersonalAccessTokenFormProps) => {
	const { t } = useTranslation();
	const nameErrorId = useId();

	const {
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<AddPersonalAccessTokenFormData>({ defaultValues: { name: '', bypassTwoFactor: 'require' } });

	const twoFactorAuthOptions: SelectOption[] = useMemo(
		() => [
			['require', t('Require_Two_Factor_Authentication')],
			['bypass', t('Ignore_Two_Factor_Authentication')],
		],
		[t],
	);

	const handleAddToken = async ({ name, bypassTwoFactor }: AddPersonalAccessTokenFormData) => {
		if (await onCreate({ tokenName: name, bypassTwoFactor: bypassTwoFactor === 'bypass' })) {
			reset();
		}
	};

	return (
		<Box is='form' onSubmit={handleSubmit(handleAddToken)}>
			<FieldGroup marginBlock={8}>
				<Field>
					<FieldRow>
						<Margins inlineEnd={4}>
							<Controller
								name='name'
								control={control}
								rules={{ validate: (value) => (isValidTokenName(value) ? undefined : t('Please_provide_a_name_for_your_token')) }}
								render={({ field }) => (
									<TextInput
										aria-label={t('API_Personal_Access_Token_Name')}
										aria-describedby={nameErrorId}
										data-qa='PersonalTokenField'
										{...field}
										placeholder={t('API_Add_Personal_Access_Token')}
									/>
								)}
							/>
							<Box>
								<Controller
									name='bypassTwoFactor'
									control={control}
									render={({ field }) => <Select {...field} aria-label={t('Two Factor Authentication')} options={twoFactorAuthOptions} />}
								/>
							</Box>
						</Margins>
						<Button primary type='submit'>
							{t('Add')}
						</Button>
					</FieldRow>
					{errors?.name && (
						<FieldError id={nameErrorId} role='alert'>
							{errors.name.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</Box>
	);
};

export default AddPersonalAccessTokenForm;
