class ValidationService {
	constructor() {}

	validateSearchResult(result) {
		//TODO validate if current user is able to get the results
		return result;
	}
}

export const validationService = new ValidationService();
