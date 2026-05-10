import type { IMedsensePharmacy } from '@rocket.chat/core-typings';

export type MedsenseEndpoints = {
	'/v1/medsense/pharmacies.list': {
		GET: (params: { pharmacyId?: string }) => {
			pharmacies: IMedsensePharmacy[];
		};
	};
	'/v1/medsense/pharmacies.list.public': {
		GET: () => {
			pharmacies: Pick<IMedsensePharmacy, '_id' | 'name'>[];
		};
	};
	'/v1/medsense/pharmacies.info': {
		GET: (params: { pharmacyId: string }) => {
			pharmacy: IMedsensePharmacy;
		};
	};
	'/v1/medsense/pharmacies.create': {
		POST: (params: { name: string; slug: string; active: boolean }) => {
			pharmacy: IMedsensePharmacy;
		};
	};
	'/v1/medsense/pharmacies.update': {
		POST: (params: { pharmacyId: string; updateData: { name?: string; active?: boolean } }) => void;
	};
	'/v1/medsense/pharmacies.available_teams': {
		GET: (params: { pharmacyId: string }) => {
			teams: {
				teamId: string;
				name: string;
				purpose?: string;
				hasLivechatAvailable: boolean;
			}[];
		};
	};
	'/v1/medsense/pharmacies.teams.create': {
		POST: (params: { pharmacyId: string; name: string; purpose: 'pharmacist' | 'tech' | 'assistant' }) => {
			team: any;
		};
	};
	'/v1/medsense/pharmacies.members.list': {
		GET: (params: { pharmacyId: string }) => {
			members: any[];
		};
	};
	'/v1/medsense/pharmacies.members.invite': {
		POST: (params: { pharmacyId: string; username?: string; email?: string; roles: string[] }) => void;
	};
	'/v1/medsense/pharmacies.members.remove': {
		POST: (params: { pharmacyId: string; userId: string }) => void;
	};
	'/v1/medsense/patient.pharmacy.mine': {
		GET: () => {
			pharmacy: IMedsensePharmacy | null;
		};
	};
	'/v1/medsense/patient.pharmacy.set': {
		POST: (params: { pharmacyId: string }) => void;
	};
	'/v1/medsense/pending.set': {
		POST: (params: { roomId: string; teamId: string }) => void;
	};
	'/v1/medsense/pending.mine': {
		GET: () => {
			rooms: {
				_id: string;
				fname?: string;
				t: string;
				pendingSetAt?: Date;
				teamId: string;
				v?: {
					_id: string;
					username: string;
					name?: string;
				};
			}[];
		};
	};
	'/v1/medsense/pending.list': {
		GET: (params: { teamId: string }) => {
			rooms: {
				_id: string;
				fname?: string;
				t: string;
				pendingSetAt?: Date;
				v?: {
					_id: string;
					username: string;
					name?: string;
				};
			}[];
		};
	};
	'/v1/medsense/pending.take': {
		POST: (params: { roomId: string }) => void;
	};
	'/v1/medsense/voice.identity.match': {
		POST: (params: { roomId: string; sessionId: string; phone: string; spokenName: string; pharmacyId?: string }) => {
			ok: true;
			matchStatus: 'matched' | 'ambiguous' | 'no_match' | 'too_many_candidates' | 'invalid_phone' | 'invalid_session';
			requiresConfirmation: boolean;
			userId?: string;
			displayName?: string;
			confidence?: number;
		};
	};
	'/v1/medsense/voice.identity.confirm': {
		POST: (params: { roomId: string; sessionId: string; userId: string; confirmationMethod: string; pharmacyId?: string }) =>
			| {
					ok: true;
					confirmed: true;
					userId: string;
					displayName: string;
					identityStatus: 'confirmed';
			  }
			| {
					ok: false;
					confirmed: false;
					error: 'pending_match_not_found' | 'pending_match_expired' | 'user_mismatch' | 'user_not_found' | 'invalid_session';
			  };
	};
};
