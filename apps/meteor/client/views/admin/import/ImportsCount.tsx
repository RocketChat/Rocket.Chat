import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

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

	const [messageCount, setMessageCount] = useSafely(useState(0));
	const [users, setUsers] = useState<SelectionUser[]>([]);
	const [channels, setChannels] = useState<SelectionChannel[]>([]);

	const [usersCount, setUsersCount] = useState<number>(0);
	const [channelsCount, setChannelsCount] = useState<number>(0);

	// const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);

	// const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);

	const router = useRouter();

	const getImportFileData = useEndpoint('GET', '/v1/getImportFileData');
	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');

	useEffect(() => {
		const loadImportFileData = async () => {
			try {
				const data: any = await waitFor(getImportFileData, (data: { waiting: boolean }) => data && !data.waiting);

				// TODO: remove
				console.log('data from waitFor is sucessfull');
				console.log(`data.message_count: ${data.message_count}`);

				if (!data) {
					throw new Error('Importer_not_setup');
				}

				setMessageCount(data.message_count);
				setUsers(data.users.map((user: SelectionUser) => ({ ...user, do_import: true })));
				// TODO: remove
				setUsersCount(users.length);
				console.log(`usersCount: ${usersCount}`);

				setChannels(data.channels.map((channel: SelectionChannel) => ({ ...channel, do_import: true })));
				setChannelsCount(channels.length);
				// TODO: remove
				console.log(`channelsCount: ${channelsCount}`);

				// TODO: remove
				console.log('setStates were sucessfull');
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
	}, [channels.length, channelsCount, getCurrentImportOperation, getImportFileData, router, setMessageCount, t, users.length, usersCount]);

	return {
		messageCount,
		usersCount,
		channelsCount,
	};
};
