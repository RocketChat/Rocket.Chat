import { JitsiCallHandler } from './JitsiCallHandler';

export default function(payload) {
	if (payload.message.t === 'jitsi_call_finished_creator') {
		JitsiCallHandler.rejectCallGlobal();
	}
	if (payload.message.t !== 'jitsi_call_started') {
		return;
	}
	return new JitsiCallHandler(payload);
}
