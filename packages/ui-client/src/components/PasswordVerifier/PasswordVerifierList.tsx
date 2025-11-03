import { Box } from '@rocket.chat/fuselage';
import type { PasswordPolicyValidation } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItem } from './PasswordVerifierItem';

export type PasswordVerifierListProps = {
	id?: string;
	validations: PasswordPolicyValidation[];
	vertical?: boolean;
};

export const PasswordVerifierList = ({ id, validations, vertical = true }: PasswordVerifierListProps) => {
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
				<Box display='flex' flexWrap='wrap' role='list' aria-labelledby={uniqueId} aria-live='polite'>
					{validations.map((validation) => (
						<PasswordVerifierItem key={validation.name} vertical={vertical} {...validation} />
					))}
				</Box>
			</Box>
		</>
	);
};
