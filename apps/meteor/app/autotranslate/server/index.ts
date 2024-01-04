/**
 * This file contains the exported members of the package shall be re-used.
 * @module AutoTranslate, TranslationProviderRegistry
 */

import { TranslationProviderRegistry } from './autotranslate';
import './permissions';
import './methods/getSupportedLanguages';
import './methods/saveSettings';
import './methods/translateMessage';
import './googleTranslate';
import './deeplTranslate';
import './msTranslate';
import './methods/getProviderUiMetadata';

export { TranslationProviderRegistry };
