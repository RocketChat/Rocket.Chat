import { Base } from './_Base';

export class Country extends Base {
	constructor() {
		super('country');
		console.log('hiiiiiiii');
	}

	insertNewCountry(country) {
		//delete country._id;
		console.log('country1', country);
		return this.insert({ name: country });
	}


	findAllCountry() {
		console.log("findAllCountry called");
		const c = this.find({}).fetch();
		console.log('find all country', c);
		return c;
	}

	findCountry(name) {
		const qeury = {
			name,
		};
		return this.find(qeury);
	}

	findAndUpdate(country, roomName) {
		const qeury = {
			name: country,
		};
		const update = {
			$push: {
				roomName,
			},
		};
		console.log('country2', country);
		// console.log('result of insert the country', this.insertNewCountry('Jordan'));
		return this.update(qeury, update);
	}
}

export default new Country();
