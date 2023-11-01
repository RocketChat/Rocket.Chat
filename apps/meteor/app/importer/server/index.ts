import { ProgressStep } from '../lib/ImporterProgressStep';
import { Importer } from './classes/Importer';
import { ImporterSelection } from './classes/ImporterSelection';
import { SelectionChannel } from './classes/ImporterSelectionChannel';
import { SelectionUser } from './classes/ImporterSelectionUser';
import { ImporterWebsocket } from './classes/ImporterWebsocket';
import { Importers } from './classes/ImportersContainer';
import './methods';
import './startup/setImportsToInvalid';
import './startup/store';

export { Importer, Importers, ImporterWebsocket, ProgressStep, ImporterSelection as Selection, SelectionChannel, SelectionUser };

Importers.add({
	key: 'api',
	name: 'API',
	visible: false,
	importer: Importer,
});
