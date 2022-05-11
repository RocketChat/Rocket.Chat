import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditSound from './EditSound';

type EditCustomSoundProps = {
	_id: string | undefined;
	onChange?: () => void;
	close?: () => void;
};

function EditCustomSound({ _id, onChange, ...props }: EditCustomSoundProps): ReactElement {
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const { value: data, phase: state, error, reload } = useEndpointData('custom-sounds.list', query);

	if (state === AsyncStatePhase.LOADING) {
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
					<Button primary danger disabled>
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
		reload?.();
	};

	return <EditSound data={data.sounds[0]} onChange={handleChange} {...props} />;
}

export default EditCustomSound;
