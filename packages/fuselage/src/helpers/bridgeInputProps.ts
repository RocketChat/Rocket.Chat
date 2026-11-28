/** The props an input hands to its element; the web element already speaks `onChange`. */
export const bridgeInputProps = <P extends { onChange?: unknown }>(props: P): P => props;
