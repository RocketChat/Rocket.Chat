import type { TextObject } from './TextObject';
import type { TextObjectType } from './TextObjectType';

it("should be enum for `TextObject['type']`", () => {
	expect<Expect<EnumToMatchTaggedUnionTags<typeof TextObjectType, TextObject, 'type'>>>(true).toBeTruthy();
});
