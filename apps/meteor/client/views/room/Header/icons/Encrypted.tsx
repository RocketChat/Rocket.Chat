import type { IRoom } from '@rocket.chat/core-typings';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useSetting } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderState } from '../../../../components/Header';

const Encrypted = ({ room }: { room: IRoom }) => {
	const { t } = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	return e2eEnabled && room?.encrypted ? <HeaderState title={t('Encrypted')} icon='key' color={colors.g500} /> : null;
};

export default memo(Encrypted);
