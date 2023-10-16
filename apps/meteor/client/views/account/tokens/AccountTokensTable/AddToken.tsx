import { Box, TextInput, Button, Field, FieldGroup, FieldLabel, FieldRow, Margins, CheckBox } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';

const AddToken = ({ reload, ...props }: { reload: () => void }): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();
	const bypassTwoFactorCheckboxId = useUniqueId();
	const setModal = useSetModal();

	const initialValues = useMemo(() => ({ name: '', bypassTwoFactor: false }), []);

	const {
		register,
		resetField,
		handleSubmit,
		formState: { isDirty, isSubmitted, submitCount },
	} = useForm({ defaultValues: initialValues });

	const handleAddToken = useCallback(
		async ({ name: tokenName, bypassTwoFactor }: typeof initialValues) => {
			try {
				const token = await createTokenFn({ tokenName, bypassTwoFactor });

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
		<FieldGroup is='form' onSubmit={handleSubmit(handleAddToken)} marginBlock={8} {...props}>
			<Field>
				<FieldRow>
					<Margins inlineEnd={4}>
						<TextInput data-qa='PersonalTokenField' {...register('name')} placeholder={t('API_Add_Personal_Access_Token')} />
					</Margins>
					<Button primary disabled={!isDirty} type='submit'>
						{t('Add')}
					</Button>
				</FieldRow>
				<FieldRow>
					<CheckBox id={bypassTwoFactorCheckboxId} {...register('bypassTwoFactor')} />
					<FieldLabel htmlFor={bypassTwoFactorCheckboxId}>{t('Ignore_Two_Factor_Authentication')}</FieldLabel>
				</FieldRow>
			</Field>
		</FieldGroup>
	);
};

export default AddToken;
