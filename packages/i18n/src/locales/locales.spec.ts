/* 
  locales.spec.ts
  - Validates locale JSON structure and content.
  - Ensures placeholders like {{token}} are well-formed.
  - Guards against empty values and trailing/leading whitespace.
  - Confirms critical keys exist and sample interpolations work.
  - Framework: auto-detect (prefers Jest, falls back to Vitest).
*/

import fs from 'node:fs';
import path from 'node:path';

// Helper: load raw JSON file (English) to assert keys/values.
// Try several common paths in this repo to be resilient.

function findLocaleFile(): string {
  const candidates = [
    // Common names
    'packages/i18n/src/locales/en.json',
    'packages/i18n/src/locales/en.i18n.json',
    'packages/i18n/src/locales/en-US.json',
    // Fallback used by this PR content dump (spec co-located)
    'packages/i18n/src/locales/en.locale.json',
    // If locales are grouped
    'packages/i18n/src/locales/en/strings.json',
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  // As a final fallback, check for a single JSON file under locales
  const all = fs.existsSync('packages/i18n/src/locales')
    ? fs
        .readdirSync('packages/i18n/src/locales')
        .filter(f => f.endsWith('.json'))
        .map(f => path.join('packages/i18n/src/locales', f))
    : []
  if (all.length) return all[0]
  throw new Error('Could not find a locale JSON file under packages/i18n/src/locales')
}

function loadJSON(file: string): Record<string, any> {
  const raw = fs.readFileSync(file, 'utf-8')
  // validate JSON syntax explicitly
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Invalid JSON in ${file}: ${(e as Error).message}`)
  }
}

function extractPlaceholders(value: string): string[] {
  const matches = [...value.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)]
  return matches.map(m => m[1])
}

// Escape dynamic strings for safe regex construction
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Token name must be alphanumeric or underscore, used to validate safety
const TOKEN_NAME_PATTERN = /^[A-Za-z0-9_]+$/

describe('Locales: structure and content', () => {
  const localeFile = findLocaleFile()
  const data = loadJSON(localeFile)

  test('is a non-empty flat dictionary of string values', () => {
    expect(typeof data).toBe('object')
    const entries = Object.entries(data)
    expect(entries.length).toBeGreaterThan(0)
    for (const [k, v] of entries) {
      expect(typeof k).toBe('string')
      // Values can be string or ICU objects (pluralization). Allow objects with "one"/"other" keys.
      const isString = typeof v === 'string'
      const isPluralObj = v && typeof v === 'object' && (('one' in v) || ('other' in v))
      expect(isString || isPluralObj).toBeTruthy()
    }
  })

  test('no empty strings and no leading/trailing spaces', () => {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') {
        expect(v).not.toBe('')
        expect(v).toBe(v.trim())
      } else if (v && typeof v === 'object') {
        for (const [pk, pv] of Object.entries(v)) {
          if (typeof pv === 'string') {
            expect(pv).not.toBe('')
            expect(pv).toBe(pv.trim())
          }
        }
      }
    }
  })

  test('placeholders {{name}} are well-formed and balanced', () => {
    const unbalanced: string[] = []
    const badTokens: Array<{ key: string; value: string; token: string }> = []
    const tokenPattern = /\{\{[^}]+\}\}/g

    for (const [k, v] of Object.entries(data)) {
      const checkValue = (s: string) => {
        // balanced braces
        const opens = (s.match(/\{\{/g) || []).length
        const closes = (s.match(/\}\}/g) || []).length
        if (opens !== closes) unbalanced.push(k)

        // tokens must be alnum/underscore inside {{ }}
        const tokens = s.match(tokenPattern) || []
        tokens.forEach(tok => {
          const name = tok.slice(2, -2).trim()
          if (!TOKEN_NAME_PATTERN.test(name)) {
            badTokens.push({ key: k, value: s, token: tok })
          }
        })
      }

      if (typeof v === 'string') {
        checkValue(v)
      } else if (v && typeof v === 'object') {
        Object.values(v).forEach(val => typeof val === 'string' && checkValue(val))
      }
    }

    expect(unbalanced).toEqual([])
    expect(badTokens).toEqual([])
  })

  test('critical keys exist', () => {
    const mustHave = [
      '500',
      'private',
      'files',
      'API_Embed_Description',
      'Accounts_EmailVerification',
      'E2E_Enabled',
      'Video_Conference',
      'Notifications',
      'Login',
      'Logout',
      'Save',
    ]
    for (const key of mustHave) {
      expect(Object.prototype.hasOwnProperty.call(data, key)).toBeTruthy()
    }
  })

  test('sample placeholder interpolation sanity', () => {
    // Map sample tokens to example values, assert interpolation looks reasonable
    const samples: Record<string, string> = {
      token: 'abc123',
      userId: 'u-1',
      roomName: 'general',
      count: '3',
      onHoldTime: '120',
      date: '2025-09-10',
      number: '5',
      username: 'alice',
      appName: 'MyApp',
      site: 'https://example.com',
    }

    const keysToCheck = [
      'API_Personal_Access_Token_Generated_Text_Token_s_UserId_s',
      'A_new_owner_will_be_assigned_automatically_to__count__rooms',
      'Back_to__roomName__channel',
      'Back_to__roomName__team',
      'Cloud_error_code',
      'E2E_reset_encryption_keys_modal_description',
      'Last_message__date__',
      'Livechat_transcript_email_subject',
      'Livechat_transfer_to_agent_auto_transfer_unanswered_chat',
      'Voip_call_duration',
    ].filter(k => Object.prototype.hasOwnProperty.call(data, k))

    for (const k of keysToCheck) {
      const raw = data[k]
      const val =
        typeof raw === 'string' ? raw : raw?.other ?? raw?.one ?? ''
      const used = extractPlaceholders(val)
      let rendered = val
      for (const u of used) {
        if (samples[u] === undefined) {
          // If sample not defined, still assert token name is non-empty
          expect(u.length).toBeGreaterThan(0)
        } else {
          // Validate token before constructing dynamic regex to prevent ReDoS
          if (!TOKEN_NAME_PATTERN.test(u)) {
            throw new Error(`Unsafe token for regex: ${u}`)
          }
          const safeToken = escapeRegex(u)
          const regex = new RegExp(`\\{\\{\\s*${safeToken}\\s*\\}\\}`, 'g')
          rendered = rendered.replace(regex, samples[u])
        }
      }
      // basic sanity: after interpolation, there should be no leftover unmatched {{ }}
      expect(/\{\{[^}]+\}\}/.test(rendered)).toBeFalsy()
    }
  })

  test('no duplicate semantic keys differing only by case', () => {
    const lowerMap = new Map<string, string[]>()
    for (const k of Object.keys(data)) {
      const lk = k.toLowerCase()
      lowerMap.set(lk, [...(lowerMap.get(lk) || []), k])
    }
    const dups = [...lowerMap.entries()].filter(([, arr]) => arr.length > 1)
    expect(dups).toEqual([])
  })
})