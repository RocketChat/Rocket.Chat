export class ConferenceCallProvider {
	constructor({
		id,
	    name,
	    template,
		type,
	}) {
		console.log('hello');
		this.id = id;
        this.name = name;
		this.template = template;
        this.type = type;
	}
}
