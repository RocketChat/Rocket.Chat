/* 
  Test framework note:
  - This spec is compatible with both Vitest and Jest. If Vitest is installed, it imports from 'vitest';
    otherwise it relies on Jest globals (describe/it/expect).
  - The repository's configured runner will pick it up based on existing config.
*/

let useVitest = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const v = require('vitest');
  // Re-export vitest's globals to satisfy TS when running under Vitest
  global.describe = v.describe;
  // @ts-ignore
  global.it = v.it;
  // @ts-ignore
  global.test = v.test;
  // @ts-ignore
  global.expect = v.expect;
  useVitest = true;
} catch (_e) {
  // Running under Jest or another environment that provides globals.
}

type LocaleValue = string | { [form: string]: string };
type LocaleMap = Record<string, LocaleValue>;

/**
 * Helper: pull the locale entries directly from this file's embedded fixtures (from the PR diff).
 * In this repo, locales are often stored as JSON; here we embed a representative slice to validate structure.
 * If the project exposes a canonical export for locales, consider importing it instead.
 */
const EN_LOCALES_PART_1: LocaleMap = {
  "500": "Internal Server Error",
  "private": "private",
  "files": "files",
  "#channel": "#channel",
  "%_of_conversations": "% of Conversations",
  "0_Errors_Only": "0 - Errors Only",
  "12_Hour": "12-hour clock",
  "1_Errors_and_Information": "1 - Errors and Information",
  "24_Hour": "24-hour clock",
  "2_Erros_Information_and_Debug": "2 - Errors, Information and Debug",
  "@username": "@username",
  "@username_message": "@username <message>",
  "API_Personal_Access_Token_Generated_Text_Token_s_UserId_s":
    "Please save your token carefully as you will no longer be able to view it afterwards. <br/>Token: <strong>{{token}}</strong><br/>Your user Id: <strong>{{userId}}</strong>",
  "Apps_Count_Enabled": {
    "one": "{{count}} app enabled",
    "other": "{{count}} apps enabled"
  },
  "Calls_in_queue": {
    "zero": "Queue is empty",
    "one": "{{count}} call in queue",
    "other": "calls in queue"
  },
  "AirGapped_Restriction_Warning": "**Your air-gapped workspace will enter read-only mode in {{remainingDays}} days.** \n Users will still be able to access rooms and read existing messages but will be unable to send new messages. \n Reconnect it to the internet or [upgrade to a premium license](https://go.rocket.chat/i/air-gapped) to prevent this."
};

const EN_LOCALES_PART_2: LocaleMap = {
  "NPS_survey_is_scheduled_to-run-at__date__for_all_users": "NPS survey is scheduled to run at {{date}} for all users. It's possible to turn off the survey on 'Admin > General > NPS'",
  "N_new_messages": "%s new messages",
  "Name": "Name",
  "No_results_found": "No results found"
};

// Merge parts (in real code, import the full source object instead of embedding fragments)
const LOCALES: LocaleMap = { ...EN_LOCALES_PART_1, ...EN_LOCALES_PART_2 };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const MUSTACHE_PLACEHOLDER = new RegExp("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*\\}\\}", "g");
const HAS_UNBALANCED_CURLIES = new RegExp("(^|[^{}])\\{(?!\\{)|\\}(?!\\})"); // single { or } not part of {{ }}
const PRINTF_PLACEHOLDER = /%s/g;

describe('i18n locales integrity (focused on PR-changed entries)', () => {
  it('should be a key->string|pluralObject map with non-empty values', () => {
    for (const [k, v] of Object.entries(LOCALES)) {
      expect(typeof k).toBe('string');
      if (typeof v === 'string') {
        expect(v).toBeTruthy();
        expect(typeof v).toBe('string');
      } else {
        expect(isObject(v)).toBe(true);
        expect(Object.keys(v).length).toBeGreaterThan(0);
        for (const [form, text] of Object.entries(v)) {
          expect(['zero', 'one', 'two', 'few', 'many', 'other']).toContain(form);
          expect(typeof text).toBe('string');
          expect(text).toBeTruthy();
        }
        // plural objects should have at least "other"
        expect(Object.prototype.hasOwnProperty.call(v, 'other')).toBe(true);
      }
    }
  });

  it('must not contain unbalanced single curly braces in strings', () => {
    for (const [k, v] of Object.entries(LOCALES)) {
      const texts = typeof v === 'string' ? [v] : Object.values(v);
      for (const t of texts) {
        expect(HAS_UNBALANCED_CURLIES.test(t)).toBe(false);
      }
    }
  });

  it('must use consistent mustache placeholders: no empty tokens and valid identifiers', () => {
    for (const [, v] of Object.entries(LOCALES)) {
      const texts = typeof v === 'string' ? [v] : Object.values(v);
      for (const t of texts) {
        const tokens = [...t.matchAll(MUSTACHE_PLACEHOLDER)].map(m => m[1]);
        for (const token of tokens) {
          expect(token.length).toBeGreaterThan(0);
          // Basic token shape: letters, numbers, underscores, dots for nested keys
          expect(/^[A-Za-z0-9_\.]+$/.test(token)).toBe(true);
        }
      }
    }
  });

  it('pluralization strings that reference {{count}} should actually include it', () => {
    for (const [, v] of Object.entries(LOCALES)) {
      if (typeof v === 'object' && v) {
        const pluralTexts = Object.values(v);
        const anyMentionsCount = pluralTexts.some(t => /\{\{\s*count\s*\}\}/.test(t));
        // If any form mentions count, then "other" form should mention it too.
        if (anyMentionsCount && typeof v.other === 'string') {
          expect(/\{\{\s*count\s*\}\}/.test(v.other)).toBe(true);
        }
      }
    }
  });

  it('printf-style placeholder keys (e.g., N_new_messages) must contain matching %s tokens', () => {
    const entriesToCheck = ['N_new_messages'];
    for (const key of entriesToCheck) {
      const v = LOCALES[key];
      expect(typeof v).toBe('string');
      const count = (v as string).match(PRINTF_PLACEHOLDER)?.length ?? 0;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('should not have leading/trailing whitespace in values', () => {
    for (const [, v] of Object.entries(LOCALES)) {
      const texts = typeof v === 'string' ? [v] : Object.values(v);
      for (const t of texts) {
        expect(t).toBe(t.trim());
      }
    }
  });

  it('HTML tags, if present, should be minimally well-formed (matching angle brackets)', () => {
    const TagLike = /<[^>]+>/g;
    for (const [, v] of Object.entries(LOCALES)) {
      const texts = typeof v === 'string' ? [v] : Object.values(v);
      for (const t of texts) {
        // Basic sanity: angles appear in pairs
        const lt = (t.match(/</g) || []).length;
        const gt = (t.match(/>/g) || []).length;
        expect(lt).toBe(gt);
        // If tags appear, ensure they at least look like <...>
        if (lt > 0 || gt > 0) {
          expect(TagLike.test(t)).toBe(true);
        }
      }
    }
  });
});