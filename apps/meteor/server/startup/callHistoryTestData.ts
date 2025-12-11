import { CallHistory, MediaCalls } from '@rocket.chat/models';

export async function addCallHistoryTestData(uid: string, extraUid: string): Promise<void> {
	const callId1 = 'rocketchat.internal.call.test';
	const callId2 = 'rocketchat.internal.call.test.2';
	const callId3 = 'rocketchat.internal.call.test.3';
	const callId4 = 'rocketchat.internal.call.test.4';

	await CallHistory.deleteMany({ uid });
	await MediaCalls.deleteMany({ _id: { $in: [callId1, callId2, callId3, callId4] } });

	await CallHistory.insertMany([
		{
			_id: 'rocketchat.internal.history.test',
			ts: new Date(),
			callId: callId1,
			state: 'ended',
			type: 'media-call',
			duration: 10,
			endedAt: new Date(),
			external: false,
			uid,
			contactId: extraUid,
			direction: 'outbound',
		},
		{
			_id: 'rocketchat.internal.history.test.2',
			ts: new Date(),
			callId: callId2,
			state: 'ended',
			type: 'media-call',
			duration: 10,
			endedAt: new Date(),
			external: false,
			uid,
			contactId: extraUid,
			direction: 'inbound',
		},
		{
			_id: 'rocketchat.internal.history.test.3',
			ts: new Date(),
			callId: callId3,
			state: 'ended',
			type: 'media-call',
			duration: 10,
			endedAt: new Date(),
			external: true,
			uid,
			direction: 'outbound',
			contactExtension: '1001',
		},
		{
			_id: 'rocketchat.internal.history.test.4',
			ts: new Date(),
			callId: callId4,
			state: 'ended',
			type: 'media-call',
			duration: 10,
			endedAt: new Date(),
			external: true,
			uid,
			direction: 'inbound',
			contactExtension: '1001',
		},
	]);

	await MediaCalls.insertMany([
		{
			_id: callId1,
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: {
				type: 'user',
				id: uid,
			},
			createdAt: new Date(),
			caller: {
				type: 'user',
				id: uid,
				contractId: 'contract1',
			},
			callee: {
				type: 'user',
				id: extraUid,
				contractId: 'contract2',
			},
			ended: true,
			endedBy: {
				type: 'user',
				id: uid,
			},
			endedAt: new Date(),
			hangupReason: 'normal',
			expiresAt: new Date(),
			acceptedAt: new Date(),
			activatedAt: new Date(),
			uids: [uid, extraUid],
		},
		{
			_id: callId2,
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: {
				type: 'user',
				id: extraUid,
			},
			createdAt: new Date(),
			caller: {
				type: 'user',
				id: extraUid,
				contractId: 'contract1',
			},
			callee: {
				type: 'user',
				id: uid,
				contractId: 'contract2',
			},
			ended: true,
			endedBy: {
				type: 'user',
				id: uid,
			},
			endedAt: new Date(),
			hangupReason: 'normal',
			expiresAt: new Date(),
			acceptedAt: new Date(),
			activatedAt: new Date(),
			uids: [uid, extraUid],
		},
		{
			_id: callId3,
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: {
				type: 'user',
				id: uid,
			},
			createdAt: new Date(),
			caller: {
				type: 'user',
				id: uid,
				contractId: 'contract1',
			},
			callee: {
				type: 'sip',
				id: '1001',
				contractId: 'contract2',
			},
			ended: true,
			endedBy: {
				type: 'user',
				id: uid,
			},
			endedAt: new Date(),
			hangupReason: 'normal',
			expiresAt: new Date(),
			acceptedAt: new Date(),
			activatedAt: new Date(),
			uids: [uid],
		},
		{
			_id: callId4,
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: {
				type: 'sip',
				id: '1001',
			},
			createdAt: new Date(),
			caller: {
				type: 'sip',
				id: '1001',
				contractId: 'contract1',
			},
			callee: {
				type: 'user',
				id: uid,
				contractId: 'contract2',
			},
			ended: true,
			endedBy: {
				type: 'user',
				id: uid,
			},
			endedAt: new Date(),
			hangupReason: 'normal',
			expiresAt: new Date(),
			acceptedAt: new Date(),
			activatedAt: new Date(),
			uids: [uid],
		},
	]);
}
