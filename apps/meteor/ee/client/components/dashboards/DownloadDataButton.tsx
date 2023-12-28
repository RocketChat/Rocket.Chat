import type { Box } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import { downloadCsvAs } from '../../../../client/lib/download';

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
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleClick = (): void => {
		if (!dataAvailable) {
			return;
		}

		Promise.resolve(dataExtractor())
			.then((data) => {
				if (!data) {
					return;
				}

				downloadCsvAs([headers, ...data], attachmentName);
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
			});
	};

	return (
		<IconButton
			secondary
			small
			mis={16}
			disabled={!dataAvailable}
			onClick={handleClick}
			aria-label={t('Download_Info')}
			icon='download'
			{...props}
		/>
	);
};

export default DownloadDataButton;
