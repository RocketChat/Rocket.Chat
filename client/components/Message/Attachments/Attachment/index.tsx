import Audio from '../components/Audio';
import Image from '../components/Image';
import Video from '../components/Video';
import Attachment from './Attachment';
import Author from './Author';
import AuthorAvatar from './AuthorAvatar';
import AuthorName from './AuthorName';
import Block from './Block';
import Collapse from './Collapse';
import Content from './Content';
import Details from './Details';
import Download from './Download';
import Inner from './Inner';
import Row from './Row';
import Size from './Size';
import Text from './Text';
import Thumb from './Thumb';
import Title from './Title';
import TitleLink from './TitleLink';

export default Object.assign(Attachment, {
	Image,
	Video,
	Audio,
	Row,
	Title,
	Text,
	TitleLink,
	Size,
	Thumb,
	Collapse,
	Download,
	Content,
	Details,
	Inner,
	Block,
	Author,
	AuthorAvatar,
	AuthorName,
});
