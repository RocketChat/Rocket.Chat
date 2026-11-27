import type { CSSProperties } from 'react';

/**
 * The inline `style` of the values a part only knows at run time (a percentage, a duration), to spread on the literal
 * render element. A frame holds only values known at build time, so these never go through one; a value with a closed
 * set of options is a variant instead.
 */
export const openStyle = <TStyle extends CSSProperties>(style: TStyle): { style: TStyle } => ({ style });
