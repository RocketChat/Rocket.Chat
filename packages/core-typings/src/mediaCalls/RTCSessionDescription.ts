export type RTCSdpType = 'answer' | 'offer' | 'pranswer' | 'rollback';

// Server-side copy of the WebRTC RTCSessionDescriptionInit shape, so packages that
// don't ship the DOM lib (models, model-typings) can type SDP payloads.
// TODO: Evaluate a proprietary backend SDP type instead of mirroring the browser RTCSessionDescriptionInit
// This alias is a hand-maintained copy of the WebRTC/DOM shape, kept only so pure-server
// packages (models, model-typings) can type SDP payloads without pulling in the whole dom lib.
// Downsides: it can silently drift from the real browser type, and it carries browser-oriented
// fields the backend never persists or acts on. A backend-owned SDP type would decouple server
// typings from the DOM, model only what we actually store/validate, and drop the dom-lib coupling
// on the media stack (media-signaling and media-calls still rely on the ambient DOM type today).
export type RTCSessionDescriptionInit = {
	sdp?: string;
	type: RTCSdpType;
};
