import populateDatabase from '../utils/fixtures/populate-database';

export default async (): Promise<void> => {
	await populateDatabase.down();
};
