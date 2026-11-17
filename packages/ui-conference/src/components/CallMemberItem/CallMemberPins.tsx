import { useTranslation } from 'react-i18next';

import PinToggle from '../../call/PinToggle';
import { useScreenShareLabels } from '../../call/hooks/useScreenShareLabels';

/** What a member's row can pin: the person, and their shared screen while they share one. */
export type MemberPins = {
	pinned: boolean;
	/** Absent for anyone not in the call's video. */
	onToggle?: () => void;
	screenPinned: boolean;
	/** Absent unless they are sharing a screen. */
	onToggleScreen?: () => void;
};

export type CallMemberPinsProps = MemberPins & {
	name: string;
	isSelf: boolean;
};

/** The pin controls of one row of the members panel. */
const CallMemberPins = ({ name, isSelf, pinned, onToggle, screenPinned, onToggleScreen }: CallMemberPinsProps) => {
	const { t } = useTranslation();
	const { pinLabelOf } = useScreenShareLabels();

	return (
		<>
			{onToggle && (
				<PinToggle
					size='small'
					variant='secondary'
					pinned={pinned}
					label={t(pinned ? 'Unpin_participant' : 'Pin_participant', { name })}
					onPinToggle={onToggle}
				/>
			)}
			{onToggleScreen && (
				<PinToggle
					size='small'
					variant='secondary'
					icon='desktop'
					pinned={screenPinned}
					label={pinLabelOf({ name, isLocal: isSelf }, screenPinned)}
					onPinToggle={onToggleScreen}
				/>
			)}
		</>
	);
};

export default CallMemberPins;
