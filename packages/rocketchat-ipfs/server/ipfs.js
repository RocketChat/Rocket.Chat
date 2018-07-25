const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

console.log(ipfsAPI);

Meteor.methods({
	getIPFS() {
		console.log(HTTP.call('GET', 'http://localhost:5001/api/v0/files/stat?arg=/rc3'));
	},
	ipfsmkdir() {
		console.log('creating Dir');
		ipfs.files.mkdir('/rc3', (err) => {
			if (err) {
				console.error(err);
				return err;
			} else {
				console.log('done');
			}
		});
	},
	ipfsdirStat() {
		const rst = HTTP.call('GET', 'http://localhost:5001/api/v0/files/stat?arg=/rc3');
		console.log(rst);
		return rst.content;
	},
	getFilesFromIPFS() {
		console.log('test');
	},
	getFile(hash) {
		const rst = HTTP.call('GET', `http://localhost:5001/api/v0/cat?arg=${ hash }`);
		// console.log("User "+Meteor.user());
		return rst.content;
	},
	async addtoIPFS(file, filename) {
		console.log('adding');
		console.log(new Buffer('stringToUse'));
		console.log(ipfs.files.write(`/rc3/${ filename }`, [new Buffer(file)], { create : true }, (err) => { // Upload buffer to IPFS
			console.log(err);
		}));
	},
	async ipfslist() {
		const data = [];
		const rst = HTTP.call('GET', 'http://localhost:5001/api/v0/files/stat?arg=/rc3');
		console.log(rst);
		const details = JSON.parse(rst.content);
		const rs = HTTP.call('GET', `http://localhost:5001/api/v0/ls?arg=${ details.Hash }&headers=false&resolve-type=true`);
		console.log('===LIST=====================');
		console.log(rs.content);
		const test = JSON.parse(rs.content);
		console.log('======================================');
		// console.log(test);
		for (let i = 1; i < test.Objects['0'].Links.length; i++) {
			data.push({ name: test.Objects['0'].Links[i].Name, Hash: test.Objects['0'].Links[i].Hash });
		}
		console.log(data);
		return data;
	},
	getlistfromIPFS(dirHash) {
		console.log(`http://localhost:5001/api/v0/ls?arg=${ dirHash }&headers=false&resolve-type=true`);
		const rst = HTTP.call('GET', `http://localhost:5001/api/v0/ls?arg=${ dirHash }&headers=false&resolve-type=true`);
		console.log(rst.content);
		return rst.content;
	}
});



