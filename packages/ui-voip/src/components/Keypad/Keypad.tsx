import { Box } from '@rocket.chat/fuselage';
import { FocusScope } from 'react-aria';

import Key from './Key';

type KeypadProps = {
	onKeyPress(key: string): void;
};

const DIGITS = [
	['1', ''],
	['2', 'ABC'],
	['3', 'DEF'],
	['4', 'GHI'],
	['5', 'JKL'],
	['6', 'MNO'],
	['7', 'PQRS'],
	['8', 'TUV'],
	['9', 'WXYZ'],
	['*', ''],
	['0', '+', '+'],
	['#', ''],
];

const Keypad = ({ onKeyPress }: KeypadProps) => (
	<FocusScope autoFocus>
		<Box display='flex' justifyContent='center' flexWrap='wrap' maxWidth={196}>
			{DIGITS.map(([primaryDigit, alternativeDigit, longPressDigit]) => (
				<Key
					large={primaryDigit === '*'}
					key={primaryDigit}
					primaryKey={primaryDigit}
					alternativeKey={alternativeDigit}
					longPressKey={longPressDigit}
					onLongKeyPress={onKeyPress}
					onKeyPress={onKeyPress}
				/>
			))}
		</Box>
	</FocusScope>
);

export default Keypad;
