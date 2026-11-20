/** The `title` of a part that renders an `svg`, whose typings leave the attribute out, to spread on the literal render element. */
export const pickSvgTitle = ({ title }: { title?: string }): { title?: string } => (title === undefined ? {} : { title });
