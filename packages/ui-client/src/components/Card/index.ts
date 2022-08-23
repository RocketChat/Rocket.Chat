import Card from './Card';
import CardBody from './CardBody';
import CardCol from './CardCol';
import CardColSection from './CardColSection';
import CardColTitle from './CardColTitle';
import CardDivider from './CardDivider';
import CardFooter from './CardFooter';
import CardFooterWrapper from './CardFooterWrapper';
import CardIcon from './CardIcon';
import Title from './CardTitle';

export const DOUBLE_COLUMN_CARD_WIDTH = 552;

export default Object.assign(Card, {
	Title,
	Body: CardBody,
	Col: Object.assign(CardCol, {
		Title: CardColTitle,
		Section: CardColSection,
	}),
	Footer: CardFooter,
	FooterWrapper: CardFooterWrapper,
	Divider: CardDivider,
	Icon: CardIcon,
});
