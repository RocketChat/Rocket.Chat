import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { FocusScope } from 'react-aria';

import DialPadButton from './components/VoipDialPadButton';
import DialPadInput from './components/VoipDialPadInput';

type DialPadProps = {
	value: string;
	editable?: boolean;
	longPress?: boolean;
	onChange(value: string, digit?: string): void;
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

const dialPadClassName = css`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px 8px 12px;

	> button {
		margin: 4px;
	}
`;

const VoipDialPad = ({ editable = false, value, longPress = true, onChange }: DialPadProps) => (
	<FocusScope autoFocus>
		<Box bg='surface-light'>
			<Box display='flex' pi={12} pbs={4} pbe={8} bg='surface-neutral'>
				<DialPadInput
					value={value}
					readOnly={!editable}
					onChange={(e) => onChange(e.currentTarget.value)}
					onBackpaceClick={() => onChange(value.slice(0, -1))}
				/>
			</Box>

			<Box className={dialPadClassName} maxWidth={196} mi='auto'>
				{DIGITS.map(([primaryDigit, subDigit, longPressDigit]) => (
					<DialPadButton
						key={primaryDigit}
						digit={primaryDigit}
						subDigit={subDigit}
						longPressDigit={longPress ? longPressDigit : undefined}
						onClick={(digit: string) => onChange(`${value}${digit}`, digit)}
					/>
				))}
			</Box>
		</Box>
	</FocusScope>
);

export default VoipDialPad;
