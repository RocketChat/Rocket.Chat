const version = 'viasat-0.1';
const getFileUrl = ({ _id, name }) => `/file-upload/${ _id }/${ name }`;

export const SWCache = {
	uploadToCache: (message, file, callback) => {
		caches.open(version).then((cache) => {
			file._id = file._id || message.file._id;
			file.name = file.name || message.file.name;
			const res = new Response(file, {
				status: 200,
				statusText: 'No connection to the server',
				headers: new Headers({ 'Content-Type': file.type }),
			});
			cache.put(getFileUrl(file), res).then(() => {
				callback();
			});
		}).catch((err) => {
			callback(err);
		});
	},

	removeFromCache: (file) => {
		caches.open(version).then((cache) => {
			cache.delete(getFileUrl(file));
		}).catch((err) => {
			console.log(err);
		});
	},

	getFileFromCache: ({ _id, name, type }) => fetch(getFileUrl({ _id, name }))
		.then((r) => r.blob())
		.then((blobFile) => new File([blobFile], name, { type })),

};
