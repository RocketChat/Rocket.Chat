import { Box } from '@rocket.chat/fuselage';
import { PasswordVerifierItem } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useVerifyPassphrase } from './useVerifyPassphrase';

type PassphraseVerifierProps = {
	passphrase: string | undefined;
	id?: string;
	vertical?: boolean;
};

export const PassphraseVerifier = ({ passphrase, id, vertical }: PassphraseVerifierProps) => {
	const { t } = useTranslation();
	const uniqueId = useId();

	const passphraseVerifications = useVerifyPassphrase(passphrase || '');

	if (!passphraseVerifications?.length) {
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
					{passphraseVerifications.map(({ isValid, limit, name }) => (
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
