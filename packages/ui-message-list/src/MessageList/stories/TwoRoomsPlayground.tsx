import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMemo, useState } from 'react';

import RoomList from './RoomList';
import { createFakeHistory } from './useFakeMessageSource';
import type { MessageListPosition } from '../lib/position';

/** Two conversations shown one at a time, each list keyed by conversation and restored where it was left. */
const TwoRoomsPlayground = () => {
	const [room, setRoom] = useState<'a' | 'b'>('a');
	const [positions] = useState(() => new Map<string, MessageListPosition>());
	const histories = useMemo(
		() => ({
			a: createFakeHistory({ size: 120, minutesApart: 13 }),
			b: createFakeHistory({ size: 80, minutesApart: 29 }),
		}),
		[],
	);

	return (
		<Box display='flex' flexDirection='column' width={480}>
			<ButtonGroup>
				<Button size='small' variant='secondary' aria-pressed={room === 'a'} onClick={() => setRoom('a')}>
					Room A
				</Button>
				<Button size='small' variant='secondary' aria-pressed={room === 'b'} onClick={() => setRoom('b')}>
					Room B
				</Button>
			</ButtonGroup>
			<Box height={480} marginBlockStart={8} borderWidth='default' borderColor='light'>
				<RoomList
					key={room}
					history={histories[room]}
					restoredPosition={positions.get(room)}
					onPositionChange={(position) => positions.set(room, position)}
				/>
			</Box>
		</Box>
	);
};

export default TwoRoomsPlayground;
