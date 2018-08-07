
import {UploadFS} from 'meteor/jalik:ufs';
import ipfsApi from 'ipfs-api';

/**
 * GoogleStorage store
 * @param options
 * @constructor
 */
export class IPFSStorage extends UploadFS.Store {

	constructor(options) {
		super(options);

		const ipfs = ipfsApi('localhost', '5001', {protocol: 'http'});
		console.log(`Connected to IPFS ${ ipfs }`);

		options.getPath = function(file) {
			if (options.uploadFolderPath[options.uploadFolderPath.length-1] !== '/') {
				options.uploadFolderPath += '/';
			}
			return options.uploadFolderPath + file._id;
		};

		options.getPath = options.getPath || function(file) {
			return file._id;
		};

		this.getPath = function(file) {
			if (file.IPFS) {
				console.log(`Path${ file.IPFS.path }`);
				return file.IPFS.path;
			}
		};
		this.create = function(file, callback) {
			check(file, Object);
			console.log('Path');
			console.log(file);
			new Promise ((resolve, reject) => {
				ipfs.files.add(file, function(err, files) {
					Window.hash = files;
					console.log(files);
					console.log(files);
					resolve(files);
					// 'files' will be an array of objects containing paths and the multihashes of the files added
				});
				// });
			});

			if (file._id == null) {
				file._id = Random.id();
			}

			file.IPFS = {
				path: this.options.getPath(file)
			};

			file.store = this.options.name; // assign store to file
			return this.getCollection().insert(file, callback);
		};
	}
}

// Add store to UFS namespace
UploadFS.store.IPFS = IPFSStorage;
