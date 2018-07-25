import {recognitionProviderService} from '../provider_service';
import RecognitionProvider from '../provider_model';

class WebkitSpeechProvider extends RecognitionProvider {

	constructor() {
		super('webkitSpeechProvider');
	}

	get i18nLabel() {
		return 'Webkit Speech provider';
	}

	get i18nDescription() {
		return 'Uses Webkit Speech API for speech recognition';
	}

}

//register provider
recognitionProviderService.register(new WebkitSpeechProvider());
