import { getCredentials } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

describe('Omnichannel - Room Tests', function () {
	this.retries(0);
	let appId = '';

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		appId = (await installTestApp()).id;

		// create test visitors
		// TODO:
		// create test departments
		// TODO:
	});

	describe('[Create and Query room using visitor with username and Id]', () => {
		before(async () => {
			// create test visitors
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});

	describe('[Create and Query room using visitor with username, Id and department]', () => {
		before(async () => {
			// create test visitors
			// TODO:
			// create test departments
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});

	describe('[Create and Query room using visitor with username and phone no]', () => {
		before(async () => {
			// create test visitors
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});

	describe('[Create and Query room using visitor with username, phone no and department]', () => {
		before(async () => {
			// create test visitors
			// TODO:
			// create test departments
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});

	describe('[Create and Query room using visitor with username and email]', () => {
		before(async () => {
			// create test visitors
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});

	describe('[Create and Query room using visitor with username, email and department]', () => {
		before(async () => {
			// create test visitors
			// TODO:
			// create test departments
			// TODO:
		});
		it('should create a room with given visitor with no open room', (done) => {
			// TODO:
		});
		it('should query open room with given visitor that has an open room', (done) => {
			// TODO:
		});
	});
});
