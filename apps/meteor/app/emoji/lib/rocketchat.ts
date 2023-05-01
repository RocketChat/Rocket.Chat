export type EmojiPackage = {
	packages: {
		base: {
			emojiCategories: Array<{ key: string; i18n: string }>;
			categoryIndex: number;
			emojisByCategory: Record<string, unknown>;
			toneList: Record<string, unknown>;
			render: (message: string) => string;
			renderPicker: (emojiToRender: string) => void;
			ascii?: boolean;
		};
		emojione?: {
			sprites: boolean;
			emojisByCategory: Record<string, unknown>;
			emojiCategories: Array<{ key: string; i18n: string }>;
			toneList: Record<string, unknown>;
			render: (message: string) => string;
			renderPicker: (emojiToRender: string) => void;
			ascii?: boolean;
		};
	};
	list: Record<
		string,
		{ emojiPackage?: keyof NonNullable<EmojiPackage['packages']> } & {
			unicode: string[];
			fname: string;
			uc: string;
			isCanonical: boolean;
		}
	>;
};
