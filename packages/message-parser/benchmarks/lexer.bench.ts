#!/usr/bin/env -S npx ts-node
/**
 * Benchmark suite for the Lexer.
 *
 * Measures tokenization performance (ops/sec) across various message categories.
 * Run with: `yarn bench` from packages/message-parser-handwritten/
 *
 */

import { Bench, type Task } from 'tinybench';
import { Lexer } from '../src/lexer/lexer';
// ── Fixture type ───────────────────────────────────────────────────────────

type Fixture = {
    name: string;
    input: string;
};

type BenchCategory = {
    name: string;
    time?: number;
    warmupTime?: number;
    fixtures: Fixture[];
};

// ── Categories ─────────────────────────────────────────────────────────────

const categories: BenchCategory[] = [
    {
        name: 'Plain Text',
        fixtures: [
            { name: 'short', input: 'Hello world' },
            {
                name: 'medium',
                input: 'The quick brown fox jumps over the lazy dog. This is a typical message one might send in a chat application.',
            },
            { name: 'long', input: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20).trim() },
        ],
    },
    {
        name: 'Emphasis / Formatting',
        fixtures: [
            { name: 'bold', input: '**Hello world**' },
            { name: 'italic', input: '_Hello world_' },
            { name: 'strike', input: '~~Hello world~~' },
            { name: 'nested', input: '**bold _italic_ and ~~strike~~**' },
            { name: 'deep nesting', input: '**bold _italic ~~strike _deep italic_~~_**' },
            { name: 'multiple', input: '**bold** normal _italic_ normal ~~strike~~ **more bold** _more italic_' },
        ],
    },
    {
        name: 'URLs & Links',
        fixtures: [
            { name: 'single URL', input: 'Check out https://rocket.chat for more info' },
            { name: 'multiple URLs', input: 'Visit https://rocket.chat or https://github.com/RocketChat or https://open.rocket.chat' },
            { name: 'markdown link', input: '[Rocket.Chat](https://rocket.chat)' },
            { name: 'with path', input: 'See https://github.com/RocketChat/Rocket.Chat/tree/develop/packages for details' },
            { name: 'image link', input: '![alt text](https://example.com/image.png)' },
            { name: 'angle bracket link', input: '<https://example.com|Example>' },
        ],
    },
    {
        name: 'Emoji & Emoticons',
        fixtures: [
            { name: 'single shortcode', input: ':smile:' },
            { name: 'triple shortcode', input: ':smile::heart::rocket:' },
            { name: 'in text', input: 'Hello :smile: world :heart: test :rocket: done' },
            { name: 'unicode emoji', input: '😀🚀🌈' },
            { name: 'mixed', input: 'Great job :thumbsup: 🎉 keep going :rocket:' },
        ],
    },
    {
        name: 'Mentions',
        fixtures: [
            { name: 'single user', input: '@admin' },
            { name: 'multiple users', input: '@admin @user1 @moderator' },
            { name: 'channel', input: '#general' },
            { name: 'mixed', input: 'Hey @admin check #general and @user1' },
        ],
    },
    {
        name: 'Code',
        fixtures: [
            { name: 'inline', input: 'Use `console.log()` for debugging' },
            { name: 'fenced block', input: '```javascript\nconst x = 1;\nconsole.log(x);\n```' },
            { name: 'multi inline', input: 'Use `Array.map()` and `Array.filter()` and `Array.reduce()`' },
            { name: 'fenced block large', input: '```typescript\n' + 'const x = 1;\n'.repeat(50) + '```' },
            { name: 'unclosed inline', input: '`unclosed code span' },
            { name: 'unclosed fenced', input: '```js\nunclosed block\nmore code' },
        ],
    },
    {
        name: 'Structured Blocks',
        fixtures: [
            { name: 'ordered list', input: '1. First item\n2. Second item\n3. Third item' },
            { name: 'unordered list', input: '- First item\n- Second item\n- Third item' },
            { name: 'task list', input: '- [x] Done task\n- [ ] Pending task\n- [x] Another done' },
            { name: 'blockquote', input: '> This is a quoted message\n> with multiple lines' },
            { name: 'heading', input: '# Hello World' },
            { name: 'heading multi-level', input: '# H1\n## H2\n### H3\n#### H4' },
            { name: 'spoiler', input: '||This is a spoiler||' },
            { name: 'spoiler with formatting', input: '||**bold** and _italic_ spoiler||' },
        ],
    },
    {
        name: 'KaTeX (Math)',
        fixtures: [
            { name: 'inline $', input: 'The formula is $E = mc^2$ in physics' },
            { name: 'block $$', input: '$$\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n$$' },
            { name: 'backslash inline', input: '\\(E = mc^2\\)' },
            { name: 'backslash block', input: '\\[\\sum_{i=1}^{n} x_i\\]' },
        ],
    },
    {
        name: 'Escapes & Structural',
        fixtures: [
            { name: 'escaped chars', input: '\\*not bold\\* and \\_not italic\\_ and \\~not strike\\~' },
            { name: 'mixed whitespace', input: 'a   b\tc\t\td' },
            { name: 'many newlines', input: 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10' },
            { name: 'CRLF', input: 'line1\r\nline2\r\nline3\r\nline4\r\nline5' },
            { name: 'timestamps', input: 'Event at <t:1630360800:f> and <t:1630447200:R>' },
            { name: 'color tokens', input: 'color:#ff0000 and color:#00ff00 and color:#0000ff' },
            { name: 'phone numbers', input: 'Call +1-555-1234 or +44-7911-123456' },
        ],
    },
    {
        name: 'Adversarial / Stress',
        time: 2000,
        warmupTime: 500,
        fixtures: [
            {
                name: 'adversarial emphasis',
                input: '**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__',
            },
            {
                name: 'adversarial mixed symbols',
                input: 'Stress test !!@#$%^&*()_+, overloading {}:"|<>?, some ,./;\'\\[], numbers 1234567890-= call s o s ok~',
            },
            { name: 'repeated specials', input: '****____~~~~||||````####>>>>' },
            {
                name: 'long with everything',
                input: '**bold** _italic_ ~~strike~~ `code` @user #channel :smile: https://example.com '.repeat(10).trim(),
            },
            {
                name: 'very long plain text',
                input: 'a '.repeat(2000).trim(),
            },
            {
                name: 'many tokens (special chars)',
                input: '*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~*_~'.repeat(5),
            },
        ],
    },
    {
        name: 'Real-World Messages',
        fixtures: [
            { name: 'simple', input: 'Hey team, the deploy is done ✅' },
            {
                name: 'medium',
                input: '@admin I pushed the fix to `develop` branch. Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details. :thumbsup:',
            },
            {
                name: 'complex',
                input: '**Release Notes v7.0**\n- [x] Fix #12345\n- [ ] Update docs\n\n> Important: check https://docs.rocket.chat\n\ncc @admin @devlead #releases :rocket:',
            },
            {
                name: 'multiline code review',
                input: 'Found a bug in `lexer.ts`:\n```typescript\nif (pos >= len) break;\n// should also check for MAX_TOKENS\n```\n@dev please review and fix before merging to `main`.',
            },
        ],
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatResults(tasks: Task[]) {
    return tasks.map((task) => {
        const r = task.result as any;
        const lat = r?.latency;
        const thr = r?.throughput;
        return {
            'Task': task.name,
            'ops/sec': Math.round(thr?.mean ?? 0).toLocaleString(),
            'Avg (ms)': ((lat?.mean ?? 0) * 1000).toFixed(4),
            'Min (ms)': ((lat?.min ?? 0) * 1000).toFixed(4),
            'Max (ms)': ((lat?.max ?? 0) * 1000).toFixed(4),
            'P99 (ms)': ((lat?.p99 ?? 0) * 1000).toFixed(4),
            'Samples': lat?.samplesCount ?? 0,
        };
    });
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function run() {
    console.log('='.repeat(72));
    console.log('  Lexer — Performance Benchmark Suite');
    console.log('='.repeat(72));
    console.log();

    for (const category of categories) {
        const bench = new Bench({
            time: category.time ?? 1000,
            warmupTime: category.warmupTime ?? 200,
        });

        for (const fixture of category.fixtures) {
            bench.add(fixture.name, () => {
                new Lexer(fixture.input).tokenize();
            });
        }

        await bench.run();

        console.log(`── ${category.name} ${'─'.repeat(Math.max(0, 56 - category.name.length))}`);
        console.table(formatResults(bench.tasks));
        console.log();
    }

    console.log('='.repeat(72));
    console.log('  Done.');
    console.log('='.repeat(72));
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
