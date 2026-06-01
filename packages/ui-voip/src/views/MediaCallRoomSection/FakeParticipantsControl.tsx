import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

// Floating dev panel that lets you grow / shrink the participant grid live
// in any call, for visual testing at different tile counts and viewport
// proportions. Renders only when explicitly enabled via a query param
// (`?fakeTiles=1`) or a localStorage flag — invisible to real users.
//
// Mounted by MediaCallRoomSection. The actual fake-participant injection
// happens upstream in the provider that owns the participants array
// (see LiveKitMediaCallProvider's useFakeParticipantCount + buildFakeParticipants).

const panelStyles = css`
	position: absolute;
	right: 12px;
	bottom: 68px;
	z-index: 30;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 8px;
	border-radius: 8px;
	background-color: rgba(20, 20, 25, 0.85);
	color: white;
	font-size: 12px;
	line-height: 1;
	user-select: none;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
`;

const buttonStyles = css`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 4px;
	border: none;
	background-color: rgba(255, 255, 255, 0.1);
	color: white;
	font-size: 14px;
	line-height: 1;
	cursor: pointer;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;

const labelStyles = css`
	min-width: 96px;
	padding-inline: 6px;
	font-variant-numeric: tabular-nums;
	text-align: center;
`;

type FakeParticipantsControlProps = {
	count: number;
	onChange: (next: number) => void;
};

const FakeParticipantsControl = ({ count, onChange }: FakeParticipantsControlProps) => {
	return (
		<Box className={panelStyles} role='group' aria-label='Fake participants control'>
			<Box
				is='button'
				type='button'
				className={buttonStyles}
				onClick={() => onChange(Math.max(0, count - 1))}
				disabled={count <= 0}
				title='Remove one'
			>
				−
			</Box>
			<Box is='button' type='button' className={buttonStyles} onClick={() => onChange(count + 1)} title='Add one'>
				+
			</Box>
			<Box is='span' className={labelStyles}>
				Fake tiles: <strong>{count}</strong>
			</Box>
			<Box is='button' type='button' className={buttonStyles} onClick={() => onChange(0)} disabled={count === 0} title='Clear'>
				×
			</Box>
		</Box>
	);
};

/**
 * Returns true when fake-tile simulation should be enabled. Checks (in
 * order): the `?fakeTiles=...` query string, the `RCFakeTiles` localStorage
 * key. Either being present (any value, including "0") turns the control
 * on so you can dial the count from zero.
 */
export const isFakeTilesEnabled = (): boolean => {
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	if (params.has('fakeTiles')) return true;
	try {
		return window.localStorage.getItem('RCFakeTiles') !== null;
	} catch {
		return false;
	}
};

/**
 * Initial fake-tile count: number from `?fakeTiles=N` if provided, else
 * the localStorage value, else 0. Anything non-numeric is treated as 0.
 */
export const initialFakeTilesCount = (): number => {
	if (typeof window === 'undefined') return 0;
	const params = new URLSearchParams(window.location.search);
	const qp = params.get('fakeTiles');
	if (qp !== null) {
		const n = parseInt(qp, 10);
		return Number.isFinite(n) && n >= 0 ? n : 0;
	}
	try {
		const ls = window.localStorage.getItem('RCFakeTiles');
		if (ls !== null) {
			const n = parseInt(ls, 10);
			return Number.isFinite(n) && n >= 0 ? n : 0;
		}
	} catch {
		/* sandboxed window */
	}
	return 0;
};

export default FakeParticipantsControl;
