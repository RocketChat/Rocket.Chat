import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { FormSkeleton } from '../../../components/Skeleton';
import EditSound from './EditSound';

type EditCustomSoundProps = {
	_id: string | undefined;
	onChange?: () => void;
	close?: () => void;
};

function EditCustomSound({ _id, onChange, close }: EditCustomSoundProps): ReactElement | null {
	const { t } = useTranslation();
	const getSounds = useEndpoint('GET', '/v1/custom-sounds.list');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, refetch } = useQuery(
		['custom-sounds', _id],
		async () => {
			const { sounds } = await getSounds({ query: JSON.stringify({ _id }) });

			if (sounds.length === 0) {
				throw new Error(t('No_results_found'));
			}
			return sounds[0];
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	if (isLoading) {
		return <FormSkeleton pi={20} />;
	}

	if (!data) {
		return null;
	}

	const handleChange: () => void = () => {
		onChange?.();
		refetch?.();
	};

	return <EditSound key={data._id} data={data} onChange={handleChange} onClose={close} />;
}

export default EditCustomSound;
