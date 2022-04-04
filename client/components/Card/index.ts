import Body from './Body';
import Card from './Card';
import CardDivider from './CardDivider';
import CardIcon from './CardIcon';
import Col from './Col';
import ColSection from './ColSection';
import ColTitle from './ColTitle';
import Footer from './Footer';
import Title from './Title';

export const DOUBLE_COLUMN_CARD_WIDTH = 552;

export default Object.assign(Card, {
	Title,
	Body,
	Col: Object.assign(Col, {
		Title: ColTitle,
		Section: ColSection,
	}),
	Footer,
	Divider: CardDivider,
	Icon: CardIcon,
});
