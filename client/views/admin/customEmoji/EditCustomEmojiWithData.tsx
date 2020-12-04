import React, { useMemo, FC } from 'react';
import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import EditCustomEmoji from './EditCustomEmoji';
import { EmojiDescriptor } from './types';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

type EditCustomEmojiWithDataProps = {
	_id: string;
	close: () => void;
	onChange: () => void;
};

const EditCustomEmojiWithData: FC<EditCustomEmojiWithDataProps> = ({ _id, onChange, ...props }) => {
	const t = useTranslation();
	const query = useMemo(() => ({ query: JSON.stringify({ _id }) }), [_id]);

	const {
		value: data = {
			emojis: {
				update: [],
			},
		},
		phase: state,
		error,
		reload,
	} = useEndpointData<{
		emojis?: {
			update: EmojiDescriptor[];
		};
	}>('emoji-custom.list', query);

	if (state === AsyncStatePhase.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || !data.emojis || data.emojis.update.length < 1) {
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	const handleChange = (): void => {
		onChange && onChange();
		reload && reload();
	};

	return <EditCustomEmoji data={data.emojis.update[0]} onChange={handleChange} {...props}/>;
};

export default EditCustomEmojiWithData;
