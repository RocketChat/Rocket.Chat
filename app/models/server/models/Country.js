import { Base } from './_Base';

export class Country extends Base {
	constructor(...args) {
		super(...args);
	}

	insertNewCountry(country) {
		// delete country._id;
		return this.insert({ name: country });
	}


	findAllCountry() {
		const c = this.find({}).fetch();
		return c;
	}

	findCountry(name) {
		const qeury = {
			name,
		};
		return this.findOne(qeury);
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
		this.update(qeury, update, (err, result) => {
			if (!err) {
				this.insertNewCountry(country);
				result = this.update(qeury, update);
			}
			return result;
		});

	}
}

export default new Country('country', true);
