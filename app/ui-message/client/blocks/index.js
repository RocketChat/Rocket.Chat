import { createTemplateForComponent } from '../../../../client/reactAdapters';
import './styles.css';
import './TextBlock';
import './ButtonElement.html';

createTemplateForComponent('ModalBlock', () => import('./ModalBlock'));
createTemplateForComponent('Blocks', () => import('./MessageBlock'));
