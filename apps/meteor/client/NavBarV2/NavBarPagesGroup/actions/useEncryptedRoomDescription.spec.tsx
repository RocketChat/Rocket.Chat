import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';

describe('useEncryptedRoomDescription', () => {
	describe('actual translation values comparison', () => {
        describe('Portuguese translations', () => {
			it('should return correct Portuguese translations for channel type', () => {
				const { result } = renderHook(() => useEncryptedRoomDescription('channel'), {
					wrapper: mockAppRoot()
						.withSetting('E2E_Enable', true)
						.withSetting('E2E_Enabled_Default_PrivateRooms', false)
                        .withSetting('language', 'pt-BR')
						.withUserPreference('language', 'pt-BR')
                        .withTranslationLanguage('pt-BR')
						.withTranslations('pt-BR', 'core', {
							Encrypted_not_available: 'Indisponível para {{roomType}} públicos',
							Not_available_for_broadcast: 'Não disponível para transmissão {{roomType}}',
							Encrypted_messages:
								'Criptografado de ponta a ponta {{roomType}}. A pesquisa não funcionará com {{roomType}} criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
							channel: 'canal',
							team: 'Equipe',
						})
						.build(),
				});

				// Test all scenarios with Portuguese translations
				expect(result.current({ isPrivate: false, broadcast: false, encrypted: false })).toBe('Indisponível para canal públicos');
				expect(result.current({ isPrivate: true, broadcast: true, encrypted: false })).toBe('Não disponível para transmissão canal');
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: true })).toBe(
					'Criptografado de ponta a ponta canal. A pesquisa não funcionará com canal criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
				);
			});

			it('should return correct Portuguese translations for team type', () => {
				const { result } = renderHook(() => useEncryptedRoomDescription('team'), {
					wrapper: mockAppRoot()
						.withSetting('E2E_Enable', true)
						.withSetting('E2E_Enabled_Default_PrivateRooms', false)
                        .withTranslationLanguage('pt-BR')
						.withTranslations('pt-BR', 'core', {
							Encrypted_not_available: 'Indisponível para {{roomType}} públicos',
							Not_available_for_broadcast: 'Não disponível para transmissão {{roomType}}',
							Encrypted_messages:
								'Criptografado de ponta a ponta {{roomType}}. A pesquisa não funcionará com {{roomType}} criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
							channel: 'canal',
							team: 'Equipe',
						})
						.build(),
				});

				// Test all scenarios with Portuguese translations
				expect(result.current({ isPrivate: false, broadcast: false, encrypted: false })).toBe('Indisponível para Equipe públicos');
				expect(result.current({ isPrivate: true, broadcast: true, encrypted: false })).toBe('Não disponível para transmissão Equipe');
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: true })).toBe(
					'Criptografado de ponta a ponta Equipe. A pesquisa não funcionará com Equipe criptografado e as notificações podem não mostrar o conteúdo das mensagens.',
				);
			});
		});

		describe('English translations', () => {
			it('should return correct English translations for channel type', () => {
				const { result } = renderHook(() => useEncryptedRoomDescription('channel'), {
					wrapper: mockAppRoot()
						.withSetting('E2E_Enable', true)
						.withSetting('E2E_Enabled_Default_PrivateRooms', false)
						.withTranslations('en', 'core', {
							Not_available_for_this_workspace: 'Not available for this workspace',
							Encrypted_not_available: 'Not available for public {{roomType}}',
							Not_available_for_broadcast: 'Not available for broadcast {{roomType}}',
							Encrypted_messages:
								'End-to-end encrypted {{roomType}}. Search will not work with encrypted {{roomType}} and notifications may not show the messages content.',
							Encrypted_messages_false: 'Messages are not encrypted',
							channel: 'Channel',
							team: 'Team',
						})
						.build(),
				});

				// Test all scenarios with English translations
				expect(result.current({ isPrivate: false, broadcast: false, encrypted: false })).toBe('Not available for public Channel');
				expect(result.current({ isPrivate: true, broadcast: true, encrypted: false })).toBe('Not available for broadcast Channel');
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: true })).toBe(
					'End-to-end encrypted Channel. Search will not work with encrypted Channel and notifications may not show the messages content.',
				);
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: false })).toBe('Messages are not encrypted');
			});

			it('should return correct English translations for team type', () => {
				const { result } = renderHook(() => useEncryptedRoomDescription('team'), {
					wrapper: mockAppRoot()
						.withSetting('E2E_Enable', true)
						.withSetting('E2E_Enabled_Default_PrivateRooms', false)
						.withTranslations('en', 'core', {
							Not_available_for_this_workspace: 'Not available for this workspace',
							Encrypted_not_available: 'Not available for public {{roomType}}',
							Not_available_for_broadcast: 'Not available for broadcast {{roomType}}',
							Encrypted_messages:
								'End-to-end encrypted {{roomType}}. Search will not work with encrypted {{roomType}} and notifications may not show the messages content.',
							Encrypted_messages_false: 'Messages are not encrypted',
							channel: 'Channel',
							team: 'Team',
						})
						.build(),
				});

				// Test all scenarios with English translations
				expect(result.current({ isPrivate: false, broadcast: false, encrypted: false })).toBe('Not available for public Team');
				expect(result.current({ isPrivate: true, broadcast: true, encrypted: false })).toBe('Not available for broadcast Team');
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: true })).toBe(
					'End-to-end encrypted Team. Search will not work with encrypted Team and notifications may not show the messages content.',
				);
				expect(result.current({ isPrivate: true, broadcast: false, encrypted: false })).toBe('Messages are not encrypted');
			});
		});
	});
});
