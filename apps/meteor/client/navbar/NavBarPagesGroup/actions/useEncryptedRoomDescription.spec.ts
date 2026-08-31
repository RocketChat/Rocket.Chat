import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';

const wrapper = mockAppRoot();

describe('useEncryptedRoomDescription', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe.each(['channel', 'team'] as const)('roomType=%s', (roomType) => {
		it('returns "Not_available_for_this_workspace" when E2E is disabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescription(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', false).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: true })).toBe('Not_available_for_this_workspace');
		});

		it('returns "Encrypted_not_available" when room is not private and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescription(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: false, encrypted: false })).toBe('Encrypted_not_available');
		});

		it('returns "Encrypted_messages" when private and encrypted are true and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescription(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages');
		});

		it('returns "Encrypted_messages_false" when private and encrypted are false and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescription(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');
		});
	});
});

describe('useEncryptedRoomDescription, Portuguese (pt-BR)', () => {
	it('returns "Encrypted_not_available" when channel is not private and E2E is enabled,', () => {
		const { result } = renderHook(() => useEncryptedRoomDescription('channel'), {
			wrapper: mockAppRoot()
				.withSetting('E2E_Enable', true)
				.withDefaultLanguage('pt-BR')
				.withTranslations('pt-BR', 'core', {
					Encrypted_not_available: 'Indisponível para {{roomType}} público',
					channel: 'canal',
					team: 'equipe',
				})
				.build(),
		});
		const describe = result.current;

		expect(describe({ isPrivate: false, encrypted: false })).toBe('Indisponível para canal público');
	});

	it('returns "Encrypted_not_available" when team is not private and E2E is enabled,', () => {
		const { result } = renderHook(() => useEncryptedRoomDescription('team'), {
			wrapper: mockAppRoot()
				.withSetting('E2E_Enable', true)
				.withDefaultLanguage('pt-BR')
				.withTranslations('pt-BR', 'core', {
					Encrypted_not_available: 'Indisponível para {{roomType}} público',
					channel: 'canal',
					team: 'equipe',
				})
				.build(),
		});
		const describe = result.current;

		expect(describe({ isPrivate: false, encrypted: false })).toBe('Indisponível para equipe público');
	});

	it('returns "Encrypted_messages" when channel is private and encrypted are true and E2E is enabled', () => {
		const { result } = renderHook(() => useEncryptedRoomDescription('channel'), {
			wrapper: mockAppRoot()
				.withSetting('E2E_Enable', true)
				.withDefaultLanguage('pt-BR')
				.withTranslations('pt-BR', 'core', {
					// TODO: Improve the portuguese translation with a way to captalize the room type for it to be in the start of the sentence
					Encrypted_messages:
						'Criptografado de ponta a ponta {{roomType}}. A pesquisa não funcionará com {{roomType}} criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
					team: 'equipe',
					channel: 'canal',
				})
				.build(),
		});
		const describe = result.current;

		expect(describe({ isPrivate: true, encrypted: true })).toBe(
			'Criptografado de ponta a ponta canal. A pesquisa não funcionará com canal criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
		);
	});

	it('returns "Encrypted_messages" when team is private and encrypted are true and E2E is enabled', () => {
		const { result } = renderHook(() => useEncryptedRoomDescription('team'), {
			wrapper: mockAppRoot()
				.withSetting('E2E_Enable', true)
				.withTranslations('pt-BR', 'core', {
					Encrypted_messages:
						'Criptografado de ponta a ponta {{roomType}}. A pesquisa não funcionará com {{roomType}} criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
					channel: 'canal',
					team: 'equipe',
				})
				.withDefaultLanguage('pt-BR')
				.build(),
		});
		const describe = result.current;

		expect(describe({ isPrivate: true, encrypted: true })).toBe(
			'Criptografado de ponta a ponta equipe. A pesquisa não funcionará com equipe criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
		);
	});
});
