import { ProgressStep } from '../lib/ImporterProgressStep';
import { Importer } from './classes/Importer';
import { ImporterSelection } from './classes/ImporterSelection';
import { SelectionChannel } from './classes/ImporterSelectionChannel';
import { SelectionUser } from './classes/ImporterSelectionUser';
import { ImporterWebsocket } from './classes/ImporterWebsocket';
import { ImportersContainer } from './classes/ImportersContainer';
import './methods';
import './startup/setImportsToInvalid';
import './startup/store';

export { Importer, ImporterWebsocket, ProgressStep, ImporterSelection as Selection, SelectionChannel, SelectionUser };

export const Importers = new ImportersContainer();

Importers.add({
	key: 'api',
	name: 'API',
	visible: false,
	importer: Importer,
});
