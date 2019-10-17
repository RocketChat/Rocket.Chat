export const upsert = (Collection, objects) => {
	const { queries } = Collection;
	Collection.queries = [];
	objects.forEach(({ _id, ...obj }, index) => {
		if (index === obj.length - 1) {
			Collection.queries = queries;
		}
		Collection.upsert({ _id }, { _id, ...obj });
	});
};
