import type { MediaCallContact } from '@rocket.chat/core-typings';

import { SipServerSession } from './Session';
import type { IMediaCallServerSettings } from '../definition/IMediaCallServer';
import { getDefaultSettings } from '../server/getDefaultSettings';

jest.mock('drachtio-srf', () => {
	return jest.fn().mockImplementation(() => ({
		on: jest.fn(),
		use: jest.fn(),
		invite: jest.fn(),
		connect: jest.fn(),
		disconnect: jest.fn(),
	}));
});

describe('SipServerSession', () => {
	let session: SipServerSession;
	let settings: IMediaCallServerSettings;

	beforeEach(() => {
		session = new SipServerSession();
		settings = {
			...getDefaultSettings(),
			sip: {
				...getDefaultSettings().sip,
				sipServer: {
					host: 'pbx.example.com',
					port: 5060,
				},
			},
		};
		session.configure(settings);
	});

	describe('getExtensionUri', () => {
		it('should format URI with extension, host, and port', () => {
			expect(session.getExtensionUri('1001')).toBe('sip:1001@pbx.example.com:5060');
		});

		it('should format URI without port when port is 0 or undefined', () => {
			settings.sip.sipServer.port = 0;
			session.configure(settings);
			expect(session.getExtensionUri('1001')).toBe('sip:1001@pbx.example.com');
		});

		it('should throw error when host is not configured', () => {
			settings.sip.sipServer.host = '';
			session.configure(settings);
			expect(() => session.getExtensionUri('1001')).toThrow('Sip Server Host is not configured');
		});
	});

	describe('getContactUri', () => {
		it('should prioritize sipExtension if present on contact', () => {
			const contact: MediaCallContact = {
				type: 'user',
				id: 'user123',
				username: 'john.doe',
				sipExtension: '4001',
			};

			expect(session.getContactUri(contact)).toBe('sip:4001@pbx.example.com:5060');
		});

		it('should use id if contact type is sip and no sipExtension is present', () => {
			const contact: MediaCallContact = {
				type: 'sip',
				id: '5001',
			};

			expect(session.getContactUri(contact)).toBe('sip:5001@pbx.example.com:5060');
		});

		it('should prefix username with user- if contact has username but no sipExtension', () => {
			const contact: MediaCallContact = {
				type: 'user',
				id: 'user123',
				username: 'john.doe',
			};

			expect(session.getContactUri(contact)).toBe('sip:user-john.doe@pbx.example.com:5060');
		});

		it('should prefix id with user- if contact has only id', () => {
			const contact: MediaCallContact = {
				type: 'user',
				id: 'user123',
			};

			expect(session.getContactUri(contact)).toBe('sip:user-user123@pbx.example.com:5060');
		});

		it('should fallback to unknown if no identifier is present', () => {
			const contact = {
				type: 'user',
				id: '',
			} as unknown as MediaCallContact;

			expect(session.getContactUri(contact)).toBe('sip:unknown@pbx.example.com:5060');
		});
	});
});
