import type { BlockElement } from './BlockElement';
import type { BlockElementType } from './BlockElementType';

it("should be enum for `BlockElement['type']`", () => {
	expect<Expect<EnumToMatchTaggedUnionTags<typeof BlockElementType, BlockElement, 'type'>>>(true).toBeTruthy();
});
