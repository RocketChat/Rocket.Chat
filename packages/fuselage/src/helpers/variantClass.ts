/**
 * Gives a variant a class name. Tamagui adds variant class names to the element alongside a consumer's `className`,
 * which a `className` default would be replaced by, but doesn't type `className` inside variants.
 */
export const variantClass = <TStyle extends object = Record<never, never>>(className: string, style?: TStyle): TStyle =>
	({ className, ...style }) as unknown as TStyle;
