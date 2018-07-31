import ipfsApi from 'ipfs-api';
// import fs from 'fs';
// import { Writable } from 'stream';
// import { test } from '../../import/functions/getFilesFromIPFS.js';
const ipfs = ipfsApi({host: 'localhost', port: '5001', protocol: 'http'});

Meteor.methods({
	ipfsaddFile(content, path) {
		// test();
		if (!path || !content) {
			throw new Meteor.Error('Error', 'Malformed request');
		}
		// ipfs.once('ready', () => console.log('IPFS node is ready'));
		content = Buffer.from(content);
		const ipfsPath = `/RocketChat/${ Meteor.userId() }`;
		ipfs.files.stat(ipfsPath, (err) => {
			if (err) {
				console.log('newDir');
				ipfs.files.mkdir(ipfsPath);
			}
			console.log(`${ ipfsPath }/${ path }`);
			console.log(content);
			return new Promise((resolve, reject) => {
				ipfs.files.write(`${ ipfsPath }/${ path }`, content, { create : true }, (err) => {
					if (err) {
						reject(err);
					}

					resolve('File Added');
				});
			});
		});
	},
	ipfslist() {
		const data = [];
		const rst = HTTP.call('GET', 'http://localhost:5001/api/v0/files/stat?arg=/rc3');
		console.log(rst);
		const details = JSON.parse(rst.content);
		return new Promise ((resolve, reject) => {
			ipfs.ls(details.Hash, (err, files) => {
				if (err) {
					reject(err);
				}
				files.forEach((file) => {
					console.log(file);
					data.push({ name: file.name, Hash: file.hash });
				});
				console.log(data);
				resolve(data);
			});
		});
	},
	getFile(hash) {
		const rst = HTTP.call('GET', `http://localhost:5001/api/v0/cat?arg=${ hash }`);
		console.log(`User ${ Meteor.user() }`);
		console.log(rst.content);
		return rst.content;
	}
});



