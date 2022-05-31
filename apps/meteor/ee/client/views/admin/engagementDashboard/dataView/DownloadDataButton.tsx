import { Box, ActionButton } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement } from 'react';

import { downloadCsvAs } from '../../../../../../client/lib/download';

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
		<ActionButton
			small
			mis='x16'
			disabled={!dataAvailable}
			onClick={handleClick}
			aria-label={t('Download_Info')}
			icon='download'
			{...props}
		/>
	);
};

export default DownloadDataButton;
