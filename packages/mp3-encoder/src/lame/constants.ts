export const MAX_FLOAT32_VALUE = 3.4028235e38;

export const LOG10 = 2.302585092994046;

export const SBMAX_l = 22;

export const SBMAX_s = 13;

export const PSFB21 = 6;

export const PSFB12 = 6;

export const CBANDS = 64;

export const NORM_TYPE = 0;

export const START_TYPE = 1;

export const SHORT_TYPE = 2;

export const STOP_TYPE = 3;

export const LAME_MAXALBUMART = 128 * 1024;

export const LAME_MAXMP3BUFFER = 16384 + LAME_MAXALBUMART;

export const BLKSIZE = 1024;

export const HBLKSIZE = BLKSIZE / 2 + 1;

export const BLKSIZE_s = 256;

export const HBLKSIZE_s = BLKSIZE_s / 2 + 1;

export const SFBMAX = SBMAX_s * 3;

export const MPG_MD_LR_LR = 0;

export const MPG_MD_MS_LR = 2;

export const SBPSY_l = 21;

export const SBPSY_s = 12;

export const SBLIMIT = 32;

export const ENCDELAY = 576;

export const POSTDELAY = 1152;

export const MDCTDELAY = 48;

export const FFTOFFSET = 224 + MDCTDELAY;

export const LAME_ID = 0xfff88e3b;

export const BPC = 320;

export const MAX_BITS_PER_GRANULE = 7680;

export const MAX_BITS_PER_CHANNEL = 4095;

export const MAX_HEADER_BUF = 256;

export const MFSIZE = 3 * 1152 + ENCDELAY - MDCTDELAY;
