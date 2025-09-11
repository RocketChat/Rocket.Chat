import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, TextInput, Button, Margins, Select, FieldError, FieldGroup, Field, FieldRow } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useUserId, useMethod } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useCallback, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AddTokenFormData = {
	name: string;
	bypassTwoFactor: string;
};

type AddTokenProps = {
	reload: () => void;
};

const AddToken = ({ reload }: AddTokenProps) => {
	const { t } = useTranslation();
	const userId = useUserId();
	const setModal = useSetModal();
	const createTokenFn = useMethod('personalAccessTokens:generateToken');
	const dispatchToastMessage = useToastMessageDispatch();

	const initialValues = useMemo(() => ({ name: '', bypassTwoFactor: 'require' }), []);

	const {
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<AddTokenFormData>({ defaultValues: initialValues });

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

				const handleDismissModal = () => {
					setModal(null);
					reload();
					reset();
				};

				setModal(
					<GenericModal title={t('API_Personal_Access_Token_Generated')} onConfirm={handleDismissModal} onClose={handleDismissModal}>
						<Box
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(
									t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
										token,
										userId,
									}),
								),
							}}
						/>
					</GenericModal>,
				);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[createTokenFn, dispatchToastMessage, reload, reset, setModal, t, userId],
	);

	const nameErrorId = useId();

	return (
		<FieldGroup is='form' onSubmit={handleSubmit(handleAddToken)} mb={8}>
			<Field>
				<FieldRow>
					<Margins inlineEnd={4}>
						<Controller
							name='name'
							control={control}
							rules={{ validate: (value) => (value.trim() ? undefined : t('Please_provide_a_name_for_your_token')) }}
							render={({ field }) => (
								<TextInput
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
								render={({ field }) => <Select {...field} options={twoFactorAuthOptions} />}
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
	);
};

export default AddToken;
