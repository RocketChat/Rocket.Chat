import type { IImportProgress } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useStream, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useMemo, useEffect } from 'react';

import type { SelectionChannel, SelectionUser } from '../../../../app/importer/server';

const waitFor = (fn: any, predicate: any) =>
	new Promise((resolve, reject) => {
		const callPromise = () => {
			fn().then((result: unknown) => {
				if (predicate(result)) {
					resolve(result);
					return;
				}

				setTimeout(callPromise, 1000);
			}, reject);
		};

		callPromise();
	});

export const ImportsCount = () => {
	const t = useTranslation();

	const [progressRate, setProgressRate] = useSafely(useState<{ rate: number } | IImportProgress>({ rate: 0 }));

	const [messageCount, setMessageCount] = useSafely(useState(0));
	const [users, setUsers] = useState([]);
	const [channels, setChannels] = useState([]);

	const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);
	const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);

	const router = useRouter();

	const getImportFileData = useEndpoint('GET', '/v1/getImportFileData');
	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');

	const streamer = useStream('importers');

	useEffect(
		() =>
			streamer('progress', (rate) => {
				setProgressRate(rate);
			}),
		[streamer, setProgressRate],
	);

	useEffect(() => {
		const loadImportFileData = async () => {
			try {
				const data: any = await waitFor(getImportFileData, (data: { waiting: boolean }) => data && !data.waiting);

				if (!data) {
					throw new Error('Importer_not_setup');
				}

				setMessageCount(data.message_count);
				setUsers(data.users.map((user: SelectionUser) => ({ ...user, do_import: true })));
				setChannels(data.channels.map((channel: SelectionChannel) => ({ ...channel, do_import: true })));
			} catch (error) {
				throw new Error('Failed_To_Load_Import_Data');
			}
		};

		const loadCurrentOperation = async () => {
			try {
				loadImportFileData();
			} catch (error) {
				throw new Error('Failed_To_Load_Import_Data');
			}
		};

		loadCurrentOperation();
	}, [getCurrentImportOperation, getImportFileData, router, setMessageCount, setProgressRate, t]);

	return {
		progressRate,
		messageCount,
		usersCount,
		channelsCount,
	};
};
