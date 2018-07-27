// import cp from 'crypto-js';
import { Meteor } from 'meteor/meteor';
// var test ;
// import { ConfigBase } from 'aws-sdk/lib/config';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="users"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="users"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="users"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="users"]'(e, t) {
		t.ac.onBlur(e);
	}
};
// shareIPFSfile
const filterNames = (old) => {
	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		return old;
	}

	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter(f => reg.test(f)).join('');
};

Template.fetchFilesfromIPFS.helpers({
	files() {

		// const result = await Meteor.call('ipfslist');
		// console.log(result);
		// return result;
		// ----------------------------------------------
		// const data = [];
		// let nit;
		// Meteor.call('ipfslist', (error, result) => {
		// 	console.log(result);
		// 	// return result;
		// });
		// const details = JSON.parse(result);
		// console.log(Meteor.call('ipfslist'));
		// --------------=======
		// new Promise((resolve, reject) => {
		// 	Meteor.call('ipfslist').then(function(rst) {
		// 		console.log(rst);

		// 		resolve(rst);
		// 	}, function(err) {
		// 		console.log(err);

		// 		reject(err);
		// 	});

		// ------------------------------==
		// resolve(Meteor.call('ipfslist'));
		// });
		// Meteor.call('ipfslist', (err, rst) => {
		// 	console.log(rst);
		// 	// return rst;
		// });
		// });
		// ----------------------------------------------
		// const data = [];
		// let nit;
		// const data = await Meteor.call('ipfslist');
		// console.log(data);
		// return data;
		// console.log(test);
		// , (err, rst) => {
		// 	const test = JSON.parse(rst);
		// 	console.log("test");
		// 	for (let i = 1; i < test.Objects['0'].Links.length; i++) {
		// 		data.push({ name: test.Objects['0'].Links[i].Name, Hash: test.Objects['0'].Links[i].Hash });
		// 	}
		//     console.log(JSON.stringify(data));
		//     console.log("test1")
		// 	nit = JSON.stringify(data);
		// });
		// console.log(nit)
		// console.log(t);
		// return t;
		// var call = Meteor.callAsync('ipfslist'){
		//     const test = JSON.parse(rst);
		//     // console.log(test);
		//     for (let i = 1; i < test.Objects['0'].Links.length; i++) {
		//         data.push({ name: test.Objects["0"].Links[i].Name, Hash: test.Objects["0"].Links[i].Hash });
		//     }
		//     console.log(JSON.stringify(data));
		//     nit = JSON.stringify(data)
		// }
		return [{'name':'banner.jpg', 'Hash':'QmYqPsG1YQK17KYm66cdAoABdKZAajydykYcdBvJ6XyUsa'}, {'name':'cropped-brave_icon_512x.jpeg', 'Hash':'Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee'}, {'name':'file.jpeg', 'Hash':'Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee'}, {'name':'file.txt', 'Hash':'QmaWTT21LMBn3HuZzFfj4GGDqhUwvTjgisQijTTU19pDyB'}, {'name':'hello (copy).txt', 'Hash':'QmPyGn4wHvx3t4xu1LFbPUgCjFTa9b72LwfwD4o39sxXg1'}, {'name':'hello.txt', 'Hash':'Qmeu5pGCUXbNhAsDpH7CH4i5w9wH5aQvWYi8rj2aDGCB7j'}, {'name':'pic01.jpg', 'Hash':'QmQBRvcKskPAi4C9Gpg2A4HXhiPaJnKsTRMUQz4rvsbN6P'}, {'name':'sam.jpeg', 'Hash':'QmRS8Nks1xNnNw6ZHtx1szNTPCQoG468CpkhkYeSXBgbwL'}, {'name':'slide03.jpg', 'Hash':'QmSmoE6ycVYrr1PUwnpQ4ELV8h6phjTFriivQKbCAiLNJB'}, {'name':'uploadIPFS.gif', 'Hash':'QmayNN7mQmsEFWygtvrxCW2ewvmZS8Mp3GgWA2WadUYWPm'}];

		// return [ { name: 'Civil_Engineering.pdf', Hash: 'QmXjg2zWAmBzvKGeybcEg26GYbEzTptoBBWHzyb6vLHGPM' }, { name: 'IPFS-what-is-it-1024x512-09-29-2016.jpg', Hash: 'QmP9W4HKyaAvGdzyRJnUYfUaotG1G1QhYprF7grQdmoeiA' }, { name: 'ROUTE_MAP_Trivandrum_.pdf', Hash: 'QmPTT3w1bZMkEfTyu4utnXAzcZsCvQaQt7qxQsiwNRJzVd' }, { name: 'banner.jpg', Hash: 'QmYqPsG1YQK17KYm66cdAoABdKZAajydykYcdBvJ6XyUsa' }, { name: 'cropped-brave_icon_512x.jpeg',Hash: 'Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee' }, { name: 'file.jpeg', Hash: 'Qme7JbBuxnC1up1qW13u2zQmG1qimaNrYgg3ao8MJEtHee' }, { name: 'file.txt', Hash: 'QmXBs8aKaGgHykf4iPtuuzB8yBdUsVBK1paJWgS9L9ohXZ' }, { name: 'hello (copy).txt', Hash: 'QmPyGn4wHvx3t4xu1LFbPUgCjFTa9b72LwfwD4o39sxXg1' }, { name: 'hello.txt',Hash: 'Qmeu5pGCUXbNhAsDpH7CH4i5w9wH5aQvWYi8rj2aDGCB7j' }, { name: 'pic01.jpg', Hash: 'QmQBRvcKskPAi4C9Gpg2A4HXhiPaJnKsTRMUQz4rvsbN6P' }, { name: 'sam.jpeg', Hash: 'QmRS8Nks1xNnNw6ZHtx1szNTPCQoG468CpkhkYeSXBgbwL' }, { name: 'slide03.jpg', Hash: 'QmSmoE6ycVYrr1PUwnpQ4ELV8h6phjTFriivQKbCAiLNJB' }, { name: 'uploadIPFS.gif', Hash: 'QmayNN7mQmsEFWygtvrxCW2ewvmZS8Mp3GgWA2WadUYWPm' } ];
		// const data = [];
		// // const d;
		// Meteor.call('ipfsdirStat', (error, result) => {
		// 	const directory = JSON.parse(result);
		// 	Meteor.call('getlistfromIPFS', directory.Hash, (err, rst) => {
		// 		const test = JSON.parse(rst);
		// 		data = test.Objects["0"].Links;
		// 		test.Objects['0'].Links.forEach(element => {
		// 			console.log(element);
		// 			data.push(element);
		// 		});
		// 		Meteor._sleepForMs(1000); // for p in 1, 2, 3 ... yields 900, 800, 700 ...
		// 		console.log(data);
		// 		console.log(JSON.stringify(data));
		// 	});
		// 	console.log(data);
		// 	console.log(JSON.stringify(data));
		// });
		// console.log(data);
		// console.log(JSON.stringify(data))

		// async function getFileList() {
		// let data = [];
		// let nit;
		// ======================================
		// return new Promise(function(resolve, reject) {
		// 	let data = [];
		// 	Meteor.call('ipfsdirStat', (error, result) => {
		// 		if(error) {
		// 			reject(error);
		// 		}
		// 	let details = JSON.parse(result);
		// 	Meteor.call('getlistfromIPFS', details.Hash, (err, rst) => {
		// 		if(err){
		// 			reject(err);
		// 		}
		// 		let test = JSON.parse(rst);
		// 		console.log(test);
		// 		for (var i=1;i<test.Objects['0'].Links.length;i++) {
		// 			data.push({name:test.Objects['0'].Links[i].Name, Hash:test.Objects['0'].Links[i].Hash});
		// 		}
		// 		console.log(JSON.stringify(data));
		// 		resolve(JSON.stringify(data));
		// 	});
		// });
		// });
		// ============================================
		// let data = [];
		// let nit;
		// const promise = Meteor.callAsync('ipfsdirStat');
		// promise.then((res) => {
		// 	let details = JSON.parse(res);
		// 	const p1 = Meteor.callAsync('getlistfromIPFS', details.Hash);
		// 	p1.then((rst) => {
		// 		let test = JSON.parse(rst);
		// 		console.log(test);
		// 		for (var i=1;i<test.Objects['0'].Links.length;i++) {
		// 			data.push({name:test.Objects['0'].Links[i].Name, Hash:test.Objects['0'].Links[i].Hash});
		// 		}
		// 		console.log(JSON.stringify(data));
		// 		return JSON.stringify(data);
		// 	});
		// });
		// }
		// function abc ()
		// {	return new Promise(function(resolve, reject)
		// 	{
		// 		let data = [];
		// 		let nit;
		// 		Meteor.call('ipfsdirStat').then(function(err, result) {
		// 			const details = JSON.parse(result);
		// 			console.log(details);
		// 			Meteor.call('getlistfromIPFS', details.Hash).then(function(err, rst) {
		// 				let test = JSON.parse(rst);
		// 				console.log(test);
		// 				for (var i=1;i<test.Objects['0'].Links.length;i++) {
		// 					data.push({name:test.Objects['0'].Links[i].Name, Hash:test.Objects['0'].Links[i].Hash});
		// 				}
		// 				console.log(JSON.stringify(data));
		// 				nit = JSON.stringify(data);
		// 				resolve(nit);
		// 				return nit;
		// 			});
		// 		});
		// 	});
		// }

		// abc().then(function(result)
		// {
		// 	console.log(result);
		// },function(err){console.error(err);})

		// var t = getFileList().then(console.log(t));
		// Promise.await(console.log(getFileList()));

		// Meteor.call('ipfsdirStat', (error, result).then(function ())
	},
	disabled() {
		return Template.instance().selectedUsers.get().length === 0;
	},
	tAddUsers() {
		return t('Add_users');
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const filter = Template.instance().userFilter.get();
		return {
			filter,
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter;
				return `@${ f.length === 0 ? text : text.replace(new RegExp(filter), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			}
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	}
});

Template.fetchFilesfromIPFS.events({
	...acEvents,
	'click .rc-tags__tag'({target}, t) {
		const {username} = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	// 'click .attachments__name'({target}, t) {
	//     console.log('clicked');
	//     console.log(t);
	//     console.log(target);
	//     // console.log(Blaze.getData(t.find('.js-ipfsHash')))
	//     // Meteor.call('getFileFromIPFS')
	// },
	// 'dblclick .js-ipfsHash'({target}, t) {
	//     console.log("double click");
	//     console.log(target);
	//     // console.log(target.attributes.getNamedItem('h').value);
	//     const {username} = Blaze.getData(t.find('.h'));
	//     console.log(Blaze.getData('js-ipfsHash'));
	//     document.getElementById('ipfsHash').value = target;
	//   },
	'click .rc-tags__tag-icon'(e, t) {
		const {username} = Blaze.getData(t.find('.rc-tags__tag-text'));
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},

	'click .js-add'(e, instance) {
		// console.log(instance.selectedUsers.get());
		// console.log(Meteor.userId);
		// const owner = Meteor.user();
		// console.log(owner);
		// const users = instance.selectedUsers.get().map(({_id}) => _id);
		// console.log(users);
		// const RID = users+owner.;
		// console.log(RID);
		// const message = `https://ipfs.io/ipfs/${ document.getElementById('ipfsHash').value }`;
		const message = `http://localhost:3000/ipfs/${ document.getElementById('ipfsHash').value }` ;
		// console.log(RID);
		Meteor.call('sendMessage', {
			rid: Session.get('openedRoom'),
			msg: message
		});
		modal.open({
			title: TAPi18n.__('Shared'),
			text: TAPi18n.__('Your_file_has_been_shared'),
			type: 'success',
			timer: 1000,
			showConfirmButton: false
		});
		instance.selectedUsers.set([]);
		document.getElementById('ipfsHash').value = null;
	}
});

Template.fetchFilesfromIPFS.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.querySelector('[name="users"]').focus();
	this.ac.element = this.firstNode.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});

Template.fetchFilesfromIPFS.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);
	const filter = {exceptions :[Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username))};
	Deps.autorun(() => {
		filter.exceptions = [Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username));
	});
	this.userFilter = new ReactiveVar('');

	this.ac = new AutoComplete({
		selector:{
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list'
		},

		limit: 10,
		inputDelay: 300,
		rules: [{
			// @TODO maybe change this 'collection' and/or template
			collection: 'UserAndRoom',
			subscription: 'userAutocomplete',
			field: 'username',
			matchAll: true,
			filter,
			doNotChangeWidth: false,
			selector(match) {
				return { term: match };
			},
			sort: 'username'
		}]
	});
	this.ac.tmplInst = this;
});
