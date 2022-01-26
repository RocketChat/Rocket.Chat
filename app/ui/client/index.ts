import './lib/accounts';
import './lib/collections';
import './lib/iframeCommands';
import './lib/menu';
import './lib/parentTemplate';
import './lib/codeMirror';
import './lib/textarea-cursor';
import './views/app/burger.html';
import './views/app/home.html';
import './views/app/notAuthorized.html';
import './views/app/pageContainer.html';
import './views/app/pageCustomContainer.html';
import './views/app/roomSearch.html';
import './views/app/userSearch.html';
import './views/app/burger';
import './views/app/home';
import './views/app/roomSearch';
import './views/app/photoswipeContent.ts'; // without the *.ts extension, *.html gets loaded first
import './components/icon';
import './components/table.html';
import './components/table';
import './components/tabs';
import './components/popupList.html';
import './components/popupList';
import './components/selectDropdown.html';

import './components/header/header';
import './components/tooltip';
import './lib/Tooltip';

export { ChatMessages } from './lib/chatMessages';
export { fileUpload } from './lib/fileUpload';
export { UserAction, USER_ACTIVITIES } from './lib/UserAction';
export { KonchatNotification } from './lib/notification';
export { Login, Button } from './lib/rocket';
export { AudioRecorder } from './lib/recorderjs/audioRecorder';
export { VideoRecorder } from './lib/recorderjs/videoRecorder';
export { chatMessages } from './views/app/room';
export * from './lib/userPopoverStatus';
