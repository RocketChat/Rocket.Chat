export type VariantBoundaries = {
	vm: number;
	vs: number;
	ve: number;
	hs: number;
	he: number;
	hm: number;
};

export function getVariantBoundaries({ anchorRect, targetRect }: { anchorRect: DOMRect; targetRect: DOMRect }): VariantBoundaries {
	return {
		vm: -targetRect.width / 2 + (anchorRect.left + anchorRect.width / 2),
		vs: anchorRect.left,
		ve: anchorRect.left + anchorRect.width - targetRect.width,
		hs: anchorRect.bottom - anchorRect.height,
		he: anchorRect.bottom - targetRect.height,
		hm: anchorRect.bottom - anchorRect.height / 2 - targetRect.height / 2,
	};
}
