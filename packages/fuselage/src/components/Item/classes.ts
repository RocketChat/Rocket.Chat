/** A part's own classes followed by the consumer's. A part renders on every update of a list, so it states them as strings. */
export const joinClasses = (own: string, className: string | undefined) => (className ? `${own} ${className}` : own);
