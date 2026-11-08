import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints, useLocalStorage, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import ConferencePanelToggles from './ConferencePanelToggles';
import ConferenceWindowGate from './ConferenceWindowGate';
import CallControls from '../call/CallControls';
import CallHeader from '../call/CallHeader';
import type { StageLayout } from '../call/CallStage';
import CallStageArea from '../call/CallStageArea';
import CallTopBarStatus from '../call/CallTopBarStatus';
import EmbeddedCallMembersPanel from '../call/EmbeddedCallMembersPanel';
import CallDiagnosticsPanel from '../call/diagnostics/CallDiagnosticsPanel';
import CallBar from '../components/CallBar';
import CallMembersPanel from '../components/CallMembersPanel/CallMembersPanel';
import CallPanel from '../components/CallPanel';
import CallTopBar from '../components/CallTopBar';
import ChatAccessNotice from '../components/ChatAccessNotice/ChatAccessNotice';
import ConferenceIframe from '../components/ConferenceIframe';
import { ChatPanelContext } from '../context/ChatPanelContext';
import type { ConferencePanel } from '../context/ConferenceContext';
import { useConference } from '../context/ConferenceContext';
import { useRinging } from '../hooks/useRinging';

/**
 * The conference window: the call, the bar above it, and the panels beside it.
 *
 * It reads the call from context and does nothing to it directly, which is what lets the whole window be drawn
 * from a fixture — and what keeps the one part it cannot build, the call's chat, a node it is handed.
 */
const ConferenceWindow = () => {
	const { room, session, call, slots, thread, viewer, panel } = useConference();

	// Which panel is open is the window's own until the application asks for it — see `panel` on the context.
	const [ownPanel, setOwnPanel] = useState<ConferencePanel | undefined>();
	const activePanel = panel ? panel.active : ownPanel;
	const setActivePanel = panel?.set ?? setOwnPanel;
	const chatVisible = activePanel === 'chat';

	const togglePanel = useCallback(
		(target: ConferencePanel) => setActivePanel(activePanel === target ? undefined : target),
		[activePanel, setActivePanel],
	);

	// A thread is shown inside the chat panel, so it goes when the chat does. Keyed on the panel rather than on
	// the click because the provider's own chat button reaches `panel.set` directly, and a thread left behind by
	// that route came back the next time the chat was opened.
	useEffect(() => {
		if (!chatVisible) {
			thread.close();
		}
	}, [chatVisible, thread]);

	// Stable: it is a context value the chat panel reads, and rebuilding it re-renders the product's whole room.
	const closeChat = useMemo(() => ({ close: () => togglePanel('chat') }), [togglePanel]);

	const breakpoints = useBreakpoints();
	const tooShortToSplit = useMediaQuery('(max-height: 520px)');

	// Too small to split in either direction. Height as well as width, because a phone in landscape is 852pt
	// wide — past `md` — and far too short to dock a panel beside the call.
	const sheetPanel = !breakpoints.includes('md') || tooShortToSplit;

	const present = useMemo(() => call.members.filter(isInVideoConference), [call.members]);

	const { callSounds } = useCustomSound();
	const otherMembers = call.canRing && session.joined ? call.members.filter((m) => m._id !== viewer.uid && !isInVideoConference(m)) : [];
	// Kept true as each ring lapses, which is what stops the dialler sounding for a call nobody is being asked about.
	const ringingMembers = useRinging(otherMembers);
	const someoneRinging = ringingMembers.length > 0;
	useEffect(() => (someoneRinging ? callSounds.playDialer() : undefined), [someoneRinging, callSounds]);

	const [stageLayout, setStageLayout] = useLocalStorage<StageLayout>('videoconf-stage-layout', 'grid');

	const [bannerDismissed, setBannerDismissed] = useState(false);

	// A call that runs in here brings its own header and controls, so the window's bars carry those instead. Only then
	// does the application provide the call's own contexts, which is what everything behind this flag reads.
	const embeddedCall = !session.url && session.embedded;

	const panelToggles = (
		<ConferencePanelToggles activePanel={activePanel} presentCount={present.length} unread={room.unread} onToggle={togglePanel} />
	);

	return (
		<ConferenceWindowGate present={present}>
			<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: 'black' }}>
				{room.chatAccess && !bannerDismissed && <ChatAccessNotice access={room.chatAccess} onDismiss={() => setBannerDismissed(true)} />}

				{embeddedCall ? (
					<CallTopBar
						host={
							<Box display='flex' flexGrow={1} minWidth={0} alignItems='center'>
								<CallHeader name={call.name} />
							</Box>
						}
					>
						{/* Before the toggles, so the queue grows into the bar's own space rather than pushing them. */}
						<CallTopBarStatus />
						{panelToggles}
					</CallTopBar>
				) : (
					<CallTopBar startAt={call.createdAt} name={call.name}>
						{panelToggles}
					</CallTopBar>
				)}

				<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
					<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
						{session.url ? <ConferenceIframe url={session.url} /> : <CallStageArea layout={stageLayout} />}
					</Box>

					<CallPanel visible={!!activePanel} sheet={sheetPanel}>
						{activePanel === 'members' &&
							(embeddedCall ? (
								<EmbeddedCallMembersPanel onClose={() => togglePanel('members')} />
							) : (
								<CallMembersPanel onClose={() => togglePanel('members')} />
							))}
						{/* The call's chat is the product's room — its provider, its message list, its composer — so it
						    arrives built. What this window owns is the panel it sits in, which is why closing it is
						    handed down rather than handed in. */}
						{activePanel === 'chat' && <ChatPanelContext.Provider value={closeChat}>{slots.chat}</ChatPanelContext.Provider>}
						{activePanel === 'diagnostics' && embeddedCall && <CallDiagnosticsPanel onClose={() => togglePanel('diagnostics')} />}
					</CallPanel>
				</Box>

				{/* Only a call running in here has controls of ours to hold; an iframe keeps its own inside the frame. */}
				{embeddedCall && (
					<CallBar
						centre={
							<CallControls layout={stageLayout} onLayoutChange={setStageLayout} onOpenDiagnostics={() => togglePanel('diagnostics')} />
						}
					/>
				)}
			</Box>
		</ConferenceWindowGate>
	);
};

export default ConferenceWindow;
