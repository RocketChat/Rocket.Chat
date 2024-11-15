module.export({useMessageFormatter:()=>useMessageFormatter});let MessageDictionary,MessageFormatter;module.link('@internationalized/message',{MessageDictionary(v){MessageDictionary=v},MessageFormatter(v){MessageFormatter=v}},0);let useCallback,useMemo;module.link('react',{useCallback(v){useCallback=v},useMemo(v){useMemo=v}},1);let useLocale;module.link('@react-aria/i18n',{useLocale(v){useLocale=v}},2);/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */



const cache = new WeakMap();

function getCachedDictionary(strings) {
  let dictionary = cache.get(strings);

  if (!dictionary) {
    dictionary = new MessageDictionary(strings);
    cache.set(strings, dictionary);
  }

  return dictionary;
}
/**
 * Handles formatting ICU Message strings to create localized strings for the current locale.
 * Automatically updates when the locale changes, and handles caching of messages for performance.
 * @param strings - A mapping of languages to strings by key.
 * @deprecated - use useLocalizedStringFormatter instead.
 */


function useMessageFormatter(strings) {
  let {
    locale
  } = useLocale();
  let dictionary = useMemo(() => getCachedDictionary(strings), [strings]);
  let formatter = useMemo(() => new MessageFormatter(locale, dictionary), [locale, dictionary]);
  return useCallback((key, variables) => formatter.format(key, variables), [formatter]);
}
