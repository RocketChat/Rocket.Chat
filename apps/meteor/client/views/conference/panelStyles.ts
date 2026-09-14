export const PANEL_INLINE_PADDING = 12;

/**
 * Marks the parts of the conference window that keep following the reader's appearance preference.
 *
 * The window itself is pinned dark — a call surface is dark wherever calls are — but what the panels beside the
 * call carry is room UI: a chat, a members list, a thread. Those are read the way the reader reads the rest of
 * Rocket.Chat, so this class is where the preference is put back, as a palette scoped to whatever wears it.
 *
 * One constant rather than a literal in each place, because the class and the style tag that gives it a palette
 * only work as a pair.
 */
export const CONFERENCE_THEMED_CLASS = 'conference-themed';
