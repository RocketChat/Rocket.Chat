declare global {
	type Expect<T extends true> = T;
	type EnumToMatchTaggedUnionTags<
		TEnum extends Record<Uppercase<TTaggedUnion[TTagField]>, any>,
		TTaggedUnion extends Record<string, any>,
		TTagField extends keyof TTaggedUnion,
	> = TEnum extends {
		[K in TTaggedUnion as Uppercase<K[TTagField]>]: TEnum[Uppercase<K[TTagField]>];
	}
		? true
		: false;
}

export {};
