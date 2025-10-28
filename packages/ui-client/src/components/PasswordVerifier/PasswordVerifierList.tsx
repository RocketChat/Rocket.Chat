import { Box } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItem } from './PasswordVerifierItem';

type PasswordVerificationProps = {
	name: string;
	isValid: boolean;
	limit?: number;
}[];

type PasswordVerifierListProps = {
	id?: string;
	validations: PasswordVerificationProps;
	vertical?: boolean;
};

export const PasswordVerifierList = ({ id, validations, vertical }: PasswordVerifierListProps) => {
	const { t } = useTranslation();
	const uniqueId = useId();

	if (!validations?.length) {
		return <span id={id} hidden></span>;
	}

	return (
		<>
			<span id={id} hidden>
				{t('Password_Policy_Aria_Description')}
			</span>
			<Box display='flex' flexDirection='column' mbs={8}>
				<Box mbe={8} fontScale='c2' id={uniqueId} aria-hidden>
					{t('Password_must_have')}
				</Box>
				<Box display='flex' flexWrap='wrap' role='list' aria-labelledby={uniqueId}>
					{validations.map(({ isValid, limit, name }) => (
						<PasswordVerifierItem
							key={name}
							text={t(`${name}-label`, { limit })}
							isValid={isValid}
							aria-invalid={!isValid}
							vertical={!!vertical}
						/>
					))}
				</Box>
			</Box>
		</>
	);
};
