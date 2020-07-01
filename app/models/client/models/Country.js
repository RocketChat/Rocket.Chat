import { CachedCountry } from './CachedCountry';

export const country = CachedCountry.collection;

country.setReactions = function(id, reactions) {
	return this.update({ _id: IDBCursor }, { $set: { reactions } });
};

country.unsetReactions = function(id) {
	return this.update({ _id: id }, { $unset: { reactions: 1 } });
};
