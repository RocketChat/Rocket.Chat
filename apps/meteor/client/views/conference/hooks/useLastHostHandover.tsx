import type { ProviderPluginControls } from '@rocket.chat/ui-conference';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceSelectNewHostModal from '../ConferenceSelectNewHostModal';

/** How long the provider gets to show the promotion in its roster before the handover is given up on. */
const HANDOVER_TIMEOUT_MS = 10_000;

/**
 * Whether the viewer is the call's only host while somebody else is still in it — the same test the provider's
 * plugin makes before it holds back a press of its Leave button. The lobby counts for neither side.
 */
const isLastHost = ({ self, participants }: Pick<ProviderPluginControls, 'self' | 'participants'>): boolean => {
	if (!self?.isHost) {
		return false;
	}

	const others = participants.filter(({ uuid, isWaiting }) => uuid !== self.participantUuid && !isWaiting);

	return others.length > 0 && !others.some(({ isHost }) => isHost);
};

/**
 * Lets the call's only host hand it to somebody else before they leave: when the provider's plugin holds their
 * leave back to ask, and when they close the window instead.
 *
 * The user leaves only once the provider's roster shows the new host: nothing answers a promotion, and leaving
 * while it is still in flight could end the call with nobody in charge of it. A promotion that never shows up
 * keeps the user in the call and tells them so.
 */
export const useLastHostHandover = ({ self, participants, actions }: ProviderPluginControls): (() => void) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const [pendingHost, setPendingHost] = useState<string>();

	// Read when the plugin asks rather than on every roster, which is when the list of candidates is wanted.
	const selfRef = useRef(self);
	selfRef.current = self;
	const participantsRef = useRef(participants);
	participantsRef.current = participants;

	useEffect(() => {
		if (!pendingHost) {
			return;
		}

		if (participants.some(({ uuid, isHost }) => uuid === pendingHost && isHost)) {
			setPendingHost(undefined);
			actions.leave();
		}
	}, [actions, participants, pendingHost]);

	useEffect(() => {
		if (!pendingHost) {
			return undefined;
		}

		const timeout = setTimeout(() => {
			setPendingHost(undefined);
			dispatchToastMessage({ type: 'error', message: t('Conference_host_handover_failed') });
		}, HANDOVER_TIMEOUT_MS);

		return () => clearTimeout(timeout);
	}, [dispatchToastMessage, pendingHost, t]);

	const selectNewHost = useCallback(() => {
		const selfUuid = selfRef.current?.participantUuid;
		const candidates = participantsRef.current.filter(({ uuid, isHost, isWaiting }) => uuid !== selfUuid && !isHost && !isWaiting);

		setModal(
			<ConferenceSelectNewHostModal
				candidates={candidates}
				onConfirm={(participantUuid) => {
					setModal(null);
					actions.setRole(participantUuid, 'host');
					setPendingHost(participantUuid);
				}}
				onLeave={() => {
					setModal(null);
					actions.leave();
				}}
				onCancel={() => setModal(null)}
			/>,
		);
	}, [actions, setModal]);

	const pendingHostRef = useRef(pendingHost);
	pendingHostRef.current = pendingHost;

	// A closing window cannot be held open for a dialog of our own, only for the browser's generic "leave site?"
	// one. The picker is opened behind it, so a user who chooses to stay finds it waiting.
	useEffect(() => {
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			if (pendingHostRef.current || !isLastHost({ self: selfRef.current, participants: participantsRef.current })) {
				return;
			}

			event.preventDefault();
			// Still the only way some browsers are told to ask.
			event.returnValue = '';
			setTimeout(selectNewHost, 0);
		};

		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [selectNewHost]);

	return selectNewHost;
};
