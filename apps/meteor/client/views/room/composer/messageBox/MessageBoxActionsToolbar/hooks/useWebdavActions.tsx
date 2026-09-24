import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useWebDAVAccountIntegrationsQuery } from '../../../../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import { useComposerCapabilities } from '../../../ComposerCapabilitiesContext';
import { useComposerMenuActions } from '../../../ComposerMenuActionsContext';

export const useWebdavActions = (disabled: boolean): GenericMenuItemProps[] => {
	const { webdavEnabled: enabled } = useComposerCapabilities();

	const { isSuccess, data } = useWebDAVAccountIntegrationsQuery({ enabled });

	const { t } = useTranslation();
	const { addWebdavAccount, pickWebdavFile } = useComposerMenuActions();

	return [
		{
			id: 'webdav-add',
			content: t('Add_Server'),
			icon: 'cloud-plus',
			disabled: !isSuccess,
			onClick: addWebdavAccount,
		},
		...(isSuccess
			? data.map((account) => ({
					id: account._id,
					content: account.name,
					icon: 'cloud-plus' as const,
					disabled,
					onClick: () => pickWebdavFile(account),
				}))
			: []),
	];
};
