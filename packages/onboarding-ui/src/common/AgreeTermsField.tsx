import { Box, CheckBox, Field, FieldError, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

type AgreeTermsFieldProp = {
	agreementField: string;
	termsHref: string;
	policyHref: string;
	control: any;
	errors: any;
};

const AgreeTermsField = ({ agreementField, termsHref, policyHref, control, errors }: AgreeTermsFieldProp) => {
	const { t } = useTranslation();

	return (
		<Field marginBlockStart='24px'>
			<FieldRow justifyContent='initial'>
				<Controller
					name='agreement'
					control={control}
					rules={{
						required: t('component.form.requiredField'),
					}}
					render={({ field: { ref, name, onBlur, onChange, value } }) => (
						<CheckBox
							ref={ref}
							id={agreementField}
							onChange={onChange}
							onBlur={onBlur}
							name={name}
							checked={value}
							aria-describedby={`${agreementField}-error`}
							aria-invalid={Boolean(errors.agreement)}
							aria-required='true'
						/>
					)}
				/>
				<FieldLabel display='inline' htmlFor={agreementField} withRichContent required fontScale='c1' marginInlineStart={4}>
					<Trans i18nKey='component.form.termsAndConditions'>
						I agree with
						<Box is='a' href={termsHref} target='_blank' rel='noopener noreferrer'>
							Terms and Conditions
						</Box>
						and
						<Box is='a' href={policyHref} target='_blank' rel='noopener noreferrer'>
							Privacy Policy
						</Box>
					</Trans>
				</FieldLabel>
			</FieldRow>
			{errors.agreement && (
				<FieldError aria-live='assertive' id={`${agreementField}-error`}>
					{t('component.form.requiredField')}
				</FieldError>
			)}
		</Field>
	);
};

export default AgreeTermsField;
