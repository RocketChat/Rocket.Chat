/**
 * Tests for useEncryptedRoomDescription hook.
 * Testing stack: Vitest + React Testing Library (renderHook).
 * If this project uses Jest, replace `vi` with `jest` and imports from 'vitest' with Jest globals.
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mocks ---
let e2eEnabled = true;

// Spyable translator that encodes the key and (optionally) roomType into the returned string
const tSpy = vi.fn((key: string, params?: { roomType?: 'channel' | 'team' }) => {
  return params?.roomType ? `${key}|${params.roomType}` : key;
});

// Spyable useSetting mock, controlled by `e2eEnabled`
const useSettingMock = vi.fn((name: string) => {
  if (name === 'E2E_Enable') {
    return e2eEnabled;
  }
  return undefined;
});

vi.mock('@rocket.chat/ui-contexts', () => ({
  useSetting: (name: string) => useSettingMock(name),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: any) => tSpy(key, params) }),
}));

// SUT
import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';

describe('useEncryptedRoomDescription', () => {
  beforeEach(() => {
    e2eEnabled = true; // default state for most tests
    tSpy.mockClear();
    useSettingMock.mockClear();
  });

  describe('roomType: channel', () => {
    it('returns workspace not available when E2E is disabled', () => {
      e2eEnabled = false;
      const { result } = renderHook(() => useEncryptedRoomDescription('channel'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: true, encrypted: true });
      expect(out).toBe('Not_available_for_this_workspace');
      expect(tSpy).toHaveBeenCalledWith('Not_available_for_this_workspace');
      expect(useSettingMock).toHaveBeenCalledWith('E2E_Enable');
    });

    it('returns not available for public channel when E2E is enabled', () => {
      const { result } = renderHook(() => useEncryptedRoomDescription('channel'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: false, encrypted: false });
      expect(out).toBe('Encrypted_not_available|channel');
      expect(tSpy).toHaveBeenCalledWith('Encrypted_not_available', { roomType: 'channel' });
    });

    it('returns encrypted hint for private encrypted channel', () => {
      const { result } = renderHook(() => useEncryptedRoomDescription('channel'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: true, encrypted: true });
      expect(out).toBe('Encrypted_messages|channel');
      expect(tSpy).toHaveBeenCalledWith('Encrypted_messages', { roomType: 'channel' });
    });

    it('returns unencrypted hint for private unencrypted channel', () => {
      const { result } = renderHook(() => useEncryptedRoomDescription('channel'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: true, encrypted: false });
      expect(out).toBe('Encrypted_messages_false');
      expect(tSpy).toHaveBeenCalledWith('Encrypted_messages_false');
    });

    it('for public channels, prioritizes not-available over encrypted=true', () => {
      const { result } = renderHook(() => useEncryptedRoomDescription('channel'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: false, encrypted: true });
      expect(out).toBe('Encrypted_not_available|channel');
      expect(tSpy).toHaveBeenCalledWith('Encrypted_not_available', { roomType: 'channel' });
    });
  });

  describe('roomType: team', () => {
    it('returns workspace not available when E2E is disabled', () => {
      e2eEnabled = false;
      const { result } = renderHook(() => useEncryptedRoomDescription('team'));
      const getDesc = result.current;

      const out = getDesc({ isPrivate: true, encrypted: true });
      expect(out).toBe('Not_available_for_this_workspace');
      expect(tSpy).toHaveBeenCalledWith('Not_available_for_this_workspace');
      expect(useSettingMock).toHaveBeenCalledWith('E2E_Enable');
    });

    it('returns correct messages for team when E2E is enabled', () => {
      const { result } = renderHook(() => useEncryptedRoomDescription('team'));
      const getDesc = result.current;

      // public team
      expect(getDesc({ isPrivate: false, encrypted: false })).toBe('Encrypted_not_available|team');
      expect(tSpy).toHaveBeenLastCalledWith('Encrypted_not_available', { roomType: 'team' });

      // private encrypted team
      expect(getDesc({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages|team');
      expect(tSpy).toHaveBeenLastCalledWith('Encrypted_messages', { roomType: 'team' });

      // private unencrypted team
      expect(getDesc({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');
      expect(tSpy).toHaveBeenLastCalledWith('Encrypted_messages_false');
    });
  });
});