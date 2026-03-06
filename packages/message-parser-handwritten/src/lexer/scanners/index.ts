// Scanner dispatch table - maps char codes to scanner functions

import { ScanFn } from '../ScanContext';
import {
    CH_TAB, CH_LF, CH_CR, CH_SPACE,
    CH_EXCLAIM, CH_HASH, CH_DOLLAR, CH_PERCENT,
    CH_LPAREN, CH_RPAREN, CH_ASTERISK, CH_PLUS,
    CH_DASH,
    CH_0, CH_9, CH_COLON, CH_SEMICOLON,
    CH_LT, CH_EQ, CH_GT, CH_AT,
    CH_B_UP, CH_D_UP, CH_X_UP,
    CH_LBRACKET, CH_BACKSLASH, CH_RBRACKET, CH_UNDERSCORE, CH_BACKTICK,
    CH_C_LO, CH_Y_LO,
    CH_PIPE, CH_TILDE,
} from '../constants/charCodes';

import { scanNewline, scanEscape, scanWhitespace } from './structural';
import { scanAsterisk, scanUnderscore, scanTilde } from './formatting';
import { scanBacktick } from './code';
import { scanDollar } from './math';
import {
    scanAngleOpen, scanAngleClose, scanExclamation,
    scanCloseBracket, scanBracketOpen, scanParenClose,
} from './links';
import { scanHash, scanDash, scanDigit, scanPipe } from './blocks';
import { scanColon, scanAt, scanPlus, scanC, scanEmoticonStarter } from './inline';

const SCANNER_TABLE: (ScanFn | undefined)[] = [];

function register(code: number, fn: ScanFn): void {
    SCANNER_TABLE[code] = fn;
}

// Whitespace & structure
register(CH_CR, scanNewline);
register(CH_LF, scanNewline);
register(CH_SPACE, scanWhitespace);
register(CH_TAB, scanWhitespace);
register(CH_BACKSLASH, scanEscape);

// Code
register(CH_BACKTICK, scanBacktick);

// Math
register(CH_DOLLAR, scanDollar);

// Formatting / emphasis
register(CH_ASTERISK, scanAsterisk);
register(CH_UNDERSCORE, scanUnderscore);
register(CH_TILDE, scanTilde);

// Links & images
register(CH_LT, scanAngleOpen);
register(CH_GT, scanAngleClose);
register(CH_EXCLAIM, scanExclamation);
register(CH_LBRACKET, scanBracketOpen);
register(CH_RBRACKET, scanCloseBracket);
register(CH_RPAREN, scanParenClose);

// Block-level
register(CH_HASH, scanHash);
register(CH_DASH, scanDash);
register(CH_PIPE, scanPipe);

// Inline
register(CH_COLON, scanColon);
register(CH_AT, scanAt);
register(CH_PLUS, scanPlus);
register(CH_C_LO, scanC);

// digits: ordered list, emoticon, URL starters
for (let d = CH_0; d <= CH_9; d++) register(d, scanDigit);

// emoticon-only starters
register(CH_EQ, scanEmoticonStarter);
register(CH_SEMICOLON, scanEmoticonStarter);
register(CH_X_UP, scanEmoticonStarter);
register(CH_D_UP, scanEmoticonStarter);
register(CH_B_UP, scanEmoticonStarter);
register(CH_PERCENT, scanEmoticonStarter);
register(CH_LPAREN, scanEmoticonStarter);
register(CH_Y_LO, scanEmoticonStarter);

export { SCANNER_TABLE };
