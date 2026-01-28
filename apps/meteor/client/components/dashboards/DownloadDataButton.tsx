import type { Box } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement,useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadCsvAs } from '../../lib/download';

type RowFor<THeaders extends readonly string[]> = readonly unknown[] & {
	length: THeaders['length'];
};

type DownloadDataButtonProps<THeaders extends readonly string[]> = {
	attachmentName: string;
	headers: RowFor<THeaders>;
	dataAvailable: boolean;
	dataExtractor: () => Promise<RowFor<THeaders>[] | undefined> | RowFor<THeaders>[] | undefined;
} & Omit<ComponentProps<typeof Box>, 'attachmentName' | 'headers' | 'data'>;

const DownloadDataButton = <H extends readonly string[]>({
	attachmentName,
	headers,
	dataAvailable,
	dataExtractor,
	...props
}: DownloadDataButtonProps<H>): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleClick = useCallback(async (): Promise<void> => {
		if (!dataAvailable) {
			return;
		}

		try {
			const data = await Promise.resolve(dataExtractor());
			if (!data ) {
				dispatchToastMessage({ type: 'warning', message: t('No_data_available') });
				return;
			}

			downloadCsvAs([headers, ...data], attachmentName);
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: t('Error_downloading_data', { error: String(error) }),
			});
		}
	}, [dataAvailable, dataExtractor, headers, attachmentName, dispatchToastMessage, t]);

	return (
		<IconButton
			secondary
			small
			disabled={!dataAvailable}
			onClick={handleClick}
			aria-label={t('Download_Info')}
			icon='download'
			{...props}
		/>
	);
};

export default DownloadDataButton;