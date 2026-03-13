export interface TrieNode {
    readonly ch: Record<number, TrieNode>;
    value: string | null;
}

function makeTrie(): TrieNode {
    return { ch: Object.create(null) as Record<number, TrieNode>, value: null };
}

export const EMOTICONS: ReadonlyArray<readonly [string, string]> = [

    ['*\\0\\/*', 'person_gesturing_ok'],
    ['*\\O\\/*', 'person_gesturing_ok'],
    ['\\O\\/',   'person_gesturing_ok'],
    ['\\0\\/',   'person_gesturing_ok'],
    ['(y)',       'thumbsup'],
    ['O:-)',  'innocent'],
    ['0:-3',  'innocent'],
    ['0:-)',  'innocent'],
    ['0;^)',  'innocent'],
    ['O;-)',  'innocent'],
    ['O:-3',  'innocent'],
    ['0:3',   'innocent'],
    ['0:)',   'innocent'],
    ['O:)',   'innocent'],
    ['O=)',   'innocent'],
    ['O:3',   'innocent'],
    [':-)',   'slight_smile'],
    [':)',    'slight_smile'],
    ['=]',   'slight_smile'],
    ['=)',    'slight_smile'],
    [':]',   'slight_smile'],
    [':-D',  'smiley'],
    [':D',   'smiley'],
    ['=D',   'smiley'],
    ['>:-)',  'laughing'],
    ['>:)',   'laughing'],
    ['>;)',   'laughing'],
    ['>=)',   'laughing'],
    ["':-)",  'sweat_smile'],
    ["':-D",  'sweat_smile'],
    ["':D",   'sweat_smile'],
    ["'=D",   'sweat_smile'],
    ["':)",   'sweat_smile'],
    ["'=)",   'sweat_smile'],
    [":')",   'joy'],
    [":'-)",  'joy'],
    ["':-(", 'sweat'],
    ["'=(",   'sweat'],
    ["':(",   'sweat'],
    [';-)',   'wink'],
    ['*-)',   'wink'],
    [';-]',   'wink'],
    [';^)',   'wink'],
    [';D',    'wink'],
    [';)',    'wink'],
    [';]',    'wink'],
    ['*)',    'wink'],
    [':-P',   'stuck_out_tongue'],
    ['=P',    'stuck_out_tongue'],
    [':P',    'stuck_out_tongue'],
    [':-b',   'stuck_out_tongue'],
    [':b',    'stuck_out_tongue'],
    [':-þ',   'stuck_out_tongue'],
    [':þ',    'stuck_out_tongue'],
    ['>:P',   'stuck_out_tongue_winking_eye'],
    ['X-P',   'stuck_out_tongue_winking_eye'],
    [':-*',   'kissing_heart'],
    [':^*',   'kissing_heart'],
    ['=*',    'kissing_heart'],
    [':*',    'kissing_heart'],
    ['>:O',   'open_mouth'],
    [':-O',   'open_mouth'],
    ['O_O',   'open_mouth'],
    [':O',    'open_mouth'],
    [':-X',   'no_mouth'],
    [':-#',   'no_mouth'],
    ['=X',    'no_mouth'],
    ['=#',    'no_mouth'],
    [':X',    'no_mouth'],
    [':#',    'no_mouth'],
    ['-___-', 'expressionless'],
    ['-__-',  'expressionless'],
    ['-_-',   'expressionless'],
    [':-/',   'confused'],
    [':-\\',  'confused'],
    [':/',    'confused'],
    [':L',    'confused'],
    ['=L',    'confused'],
    ['=/',    'confused'],
    ['=\\',   'confused'],
    ['>:\\',  'confused'],
    ['>:/',   'confused'],
    [':-.', 'confused'],
    ['>.<',  'persevere'],
    [":'(",   'cry'],
    [":'-(",  'cry'],
    [';-(',   'cry'],
    [';(',    'cry'],
    ['>:(',   'angry'],
    ['>:-(',  'angry'],
    [':@',    'angry'],
    [':$',    'flushed'],
    ['=$',    'flushed'],
    ['D:',    'fearful'],
    ['B-)',   'sunglasses'],
    ['B)',    'sunglasses'],
    ['8-)',   'sunglasses'],
    ['8)',    'sunglasses'],
    ['B-D',   'sunglasses'],
    ['8-D',   'sunglasses'],
    ['>:[',   'disappointed'],
    [':-(', 'disappointed'],
    [':(', 'disappointed'],
    [':-[', 'disappointed'],
    [':[', 'disappointed'],
    ['=(', 'disappointed'],
    ['#-)',   'dizzy_face'],
    ['#)',    'dizzy_face'],
    ['%-)',   'dizzy_face'],
    ['%)',    'dizzy_face'],
    ['X)',    'dizzy_face'],
    ['X-)',   'dizzy_face'],
    ['</3',   'broken_heart'],
    ['<3',    'heart'],
] as const;

function buildEmoticonTrie(): TrieNode {
    const root = makeTrie();
    for (const [raw] of EMOTICONS) {
        let node = root;
        for (let i = 0; i < raw.length; i++) {
            const code = raw.charCodeAt(i);
            if (!node.ch[code]) node.ch[code] = makeTrie();
            node = node.ch[code];
        }
        node.value = raw;
    }
    return root;
}

export const EMOTICON_TRIE = buildEmoticonTrie();

const _emoticonObj: Record<string, string> = Object.create(null) as Record<string, string>;
for (const [raw, code] of EMOTICONS) _emoticonObj[raw] = code;

export function getEmoticonShortCode(raw: string): string | undefined {
    return _emoticonObj[raw];
}
