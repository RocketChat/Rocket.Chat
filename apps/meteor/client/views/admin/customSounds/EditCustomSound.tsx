import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import EditSound from './EditSound';

type EditCustomSoundProps = {
	_id: string | undefined;
	onChange?: () => void;
	close?: () => void;
};

function EditCustomSound({ _id, onChange, ...props }: EditCustomSoundProps): ReactElement | null {
	const t = useTranslation();
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
		return (
			<Box pb={20}>
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs={8}>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs={8}>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
	}

	if (!data) {
		return null;
	}

	const handleChange: () => void = () => {
		onChange?.();
		refetch?.();
	};

	return <EditSound data={data} onChange={handleChange} {...props} />;
}

export default EditCustomSound;
