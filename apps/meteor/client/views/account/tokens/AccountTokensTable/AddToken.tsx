import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, TextInput, Button, Margins, Select } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';

type AddTokenFormData = {
	name: string;
	bypassTwoFactor: 'require' | 'bypass';
};

type AddTokenProps = {
	reload: () => void;
};

const AddToken = ({ reload }: AddTokenProps) => {
	const t = useTranslation();
	const userId = useUserId();
	const setModal = useSetModal();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		resetField,
		handleSubmit,
		control,
		formState: { isSubmitted, submitCount },
	} = useForm<AddTokenFormData>({ defaultValues: { name: '', bypassTwoFactor: 'require' } });

	const twoFactorAuthOptions: SelectOption[] = useMemo(
		() => [
			['require', t('Require_Two_Factor_Authentication')],
			['bypass', t('Ignore_Two_Factor_Authentication')],
		],
		[t],
	);

	const handleAddToken = useCallback(
		async ({ name: tokenName, bypassTwoFactor }: AddTokenFormData) => {
			try {
				const token = await createTokenFn({ tokenName, bypassTwoFactor: bypassTwoFactor === 'bypass' });

				setModal(
					<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={() => setModal(null)} onClose={() => setModal(null)}>
						<Box
							dangerouslySetInnerHTML={{
								__html: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
									token,
									userId,
								}),
							}}
						/>
					</GenericModal>,
				);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[createTokenFn, dispatchToastMessage, setModal, t, userId],
	);

	useEffect(() => {
		resetField('name');
		reload();
	}, [isSubmitted, submitCount, reload, resetField]);

	return (
		<Box display='flex' is='form' onSubmit={handleSubmit(handleAddToken)} mb={8}>
			<Box display='flex' width='100%'>
				<Margins inlineEnd={4}>
					<TextInput data-qa='PersonalTokenField' {...register('name')} placeholder={t('API_Add_Personal_Access_Token')} />
					<Box>
						<Controller
							name='bypassTwoFactor'
							control={control}
							render={({ field }) => <Select {...field} options={twoFactorAuthOptions} />}
						/>
					</Box>
				</Margins>
			</Box>
			<Button primary type='submit'>
				{t('Add')}
			</Button>
		</Box>
	);
};

export default AddToken;
