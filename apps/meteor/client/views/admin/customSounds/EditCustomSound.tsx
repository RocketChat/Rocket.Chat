import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import EditSound from './EditSound';

type EditCustomSoundProps = {
	_id: string | undefined;
	onChange?: () => void;
	close?: () => void;
};

function EditCustomSound({ _id, onChange, ...props }: EditCustomSoundProps): ReactElement {
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const getSounds = useEndpoint('GET', '/v1/custom-sounds.list');

	const { data, isLoading, error, refetch } = useQuery(['custom-sounds.list', query], async () => {
		const sound = await getSounds(query);
		return sound;
	});

	if (isLoading) {
		return (
			<Box pb='x20'>
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
	}

	if (error || !data || data.sounds.length < 1) {
		return (
			<Box fontScale='h2' pb='x20'>
				{error}
			</Box>
		);
	}

	const handleChange: () => void = () => {
		onChange?.();
		refetch?.();
	};

	return <EditSound data={data.sounds[0]} onChange={handleChange} {...props} />;
}

export default EditCustomSound;
