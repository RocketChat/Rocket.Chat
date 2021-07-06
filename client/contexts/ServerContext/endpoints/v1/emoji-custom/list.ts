type EmojiDescriptor = {
	_id: string;
	name: string;
	aliases: string[];
	extension: string;
};

export type ListEndpoint = {
	GET: (params: { query: string }) => {
		emojis?: {
			update: EmojiDescriptor[];
		};
	};
};
