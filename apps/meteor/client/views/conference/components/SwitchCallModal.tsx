import { Box, Callout } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useMutation } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

type SwitchCallModalProps = {
	/** The call this user is in, which answering the other one means leaving. */
	leaving: { callId: string; name: string };
	/** Leaves that call and joins the other. Rejects if the leave failed, which is what is shown below. */
	onConfirm: () => Promise<void>;
	onCancel: () => void;
};

/**
 * Asks before swapping the call someone is in the middle of.
 *
 * A user is in one call at a time. The call window is shared, so joining a second call already replaces the
 * first one's page — but that is not the same as leaving it: without an explicit leave its participant stays
 * counted as present, which keeps the abandoned call listed as occupied and stops it ever emptying out. And
 * doing that because someone clicked a name in a list is not something to do quietly, so the question names the
 * call being left.
 *
 * The answer takes a round trip, so the modal stays until it comes back: the button carries the wait, and a
 * failure is said *here*, next to the button that caused it, rather than in a toast on a screen this modal has
 * already left. Closing on click would have read as success — and a reader who cannot see a corner of the screen
 * light up would have been told nothing at all.
 */
const SwitchCallModal = ({ leaving, onConfirm, onCancel }: SwitchCallModalProps) => {
	const { t } = useTranslation();

	const { mutate: confirm, isPending, error } = useMutation({ mutationFn: onConfirm });

	// A leave already on its way cannot be called back, so there is nothing left for this to cancel: dismissing
	// here would hide a failure the user has to see, or leave the join to arrive on a screen that has gone. The
	// close button stays where it is and does nothing, rather than vanishing for the length of a request.
	const dismiss = () => {
		if (!isPending) {
			onCancel();
		}
	};

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Leave_the_call_you_are_in')}
			confirmText={t('Join')}
			confirmLoading={isPending}
			cancelDisabled={isPending}
			onConfirm={() => confirm()}
			onCancel={dismiss}
		>
			{/* The call being left is the whole point of asking, so its name is emphasised rather than buried in the
			    sentence — which needs `Trans`, since `t` would put the markup on screen as text. */}
			<Trans
				i18nKey='Leave__name__to_join_this_call'
				values={{ name: leaving.name }}
				components={{ b: <Box is='span' fontScale='p2b' color='default' /> }}
			/>
			{error && (
				<Box marginBlockStart={16}>
					{/* `role='alert'` so it reaches a reader when it appears: this is the answer to the button they
					    just pressed, and it arrives after they pressed it. */}
					<Callout type='danger' role='alert'>
						{t('Could_not_leave_the_call_you_are_in')}
					</Callout>
				</Box>
			)}
		</GenericModal>
	);
};

export default SwitchCallModal;
