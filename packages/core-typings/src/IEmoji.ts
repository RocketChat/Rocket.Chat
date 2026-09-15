// Shape of the data broadcast for a custom emoji create/update/delete (see `emoji.updateCustom` /
// `emoji.deleteCustom` events and the `updateEmojiCustom` / `deleteEmojiCustom` notification streams).
// It is a superset of the fields sent from the different call sites that publish these events, so most
// fields besides `name` and `extension` are optional.
export interface IEmoji {
	_id?: string;
	name: string;
	aliases?: string[];
	extension: string;
	etag?: string;
	previousName?: string;
	previousExtension?: string;
	newFile?: boolean;
}
