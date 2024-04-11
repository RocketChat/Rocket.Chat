import { renderHook } from '@testing-library/react-hooks';
import * as i18next from 'i18next';
import type { FunctionComponent } from 'react';
import { Suspense } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { AppIdProvider } from '../contexts/AppIdContext';
import { useAppTranslation } from './useAppTranslation';

let i18n: i18next.i18n;

beforeEach(async () => {
  i18n = i18next.createInstance().use(initReactI18next);

  await i18n.init({
    lng: 'en',
    resources: {
      en: {
        'translation': {
          test: 'a quick brown fox',
        },
        'app-test': {
          test: 'jumped over the lazy dog',
        },
        'app-test-core': {
          test: 'this should not be used',
        },
      },
    },
  });
});

it('should work with normal app ID (`test`)', async () => {
  const { result } = renderHook(() => useAppTranslation().t('test'), {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <AppIdProvider appId='test'>{children}</AppIdProvider>
      </I18nextProvider>
    ),
  });

  expect(result.current).toBe('jumped over the lazy dog');
});

it('should work with core app ID (`test-core`)', async () => {
  const { result } = renderHook(() => useAppTranslation().t('test'), {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <AppIdProvider appId='test-core'>{children}</AppIdProvider>
      </I18nextProvider>
    ),
  });

  expect(result.current).toBe('a quick brown fox');
});

describe('with suspense', () => {
  let i18n: i18next.i18n;

  beforeEach(async () => {
    i18n = i18next
      .createInstance()
      .use({
        type: 'backend',
        init: () => undefined,
        read: async (language, namespace) => {
          await new Promise<void>((resolve) => queueMicrotask(resolve));

          if (language === 'en' && namespace === 'core') {
            return {
              test: 'a quick brown fox',
            };
          }

          if (language === 'en' && namespace === 'app-test') {
            return {
              test: 'jumped over the lazy dog',
            };
          }

          throw new Error(`Unexpected read request: ${language} ${namespace}`);
        },
      } satisfies i18next.BackendModule)
      .use(initReactI18next);

    await i18n.init({
      lng: 'en',
      defaultNS: 'core',
      partialBundledLanguages: true,
      react: {
        useSuspense: true,
      },
    });
  });

  it('should work with normal app ID (`test`)', async () => {
    const FakeFallback: FunctionComponent = jest.fn(() => null);

    const { result, waitForNextUpdate } = renderHook(
      () => useAppTranslation().t('test'),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={<FakeFallback />}>
              <AppIdProvider appId='test'>{children}</AppIdProvider>
            </Suspense>
          </I18nextProvider>
        ),
      }
    );

    await waitForNextUpdate();

    expect(result.current).toBe('jumped over the lazy dog');
    expect(FakeFallback).toHaveBeenCalled();
  });

  it('should work with core app ID (`test-core`)', async () => {
    const FakeFallback: FunctionComponent = jest.fn(() => null);

    const { result, waitForNextUpdate } = renderHook(
      () => useAppTranslation().t('test'),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={<FakeFallback />}>
              <AppIdProvider appId='test-core'>{children}</AppIdProvider>
            </Suspense>
          </I18nextProvider>
        ),
      }
    );

    await waitForNextUpdate();

    expect(result.current).toBe('a quick brown fox');
    expect(FakeFallback).toHaveBeenCalled();
  });
});
