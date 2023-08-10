import Card from './Card';
import CardBody from './CardBody';
import CardCol from './CardCol';
import CardColSection from './CardColSection';
import CardColTitle from './CardColTitle';
import CardDivider from './CardDivider';
import CardFooter from './CardFooter';
import CardFooterWrapper from './CardFooterWrapper';
import CardIcon from './CardIcon';
import CardTitle from './CardTitle';

export const DOUBLE_COLUMN_CARD_WIDTH = 552;

/**
 * @deprecated Avoid default usage, use named imports instead
 */
export default Object.assign(Card, {
	Title: CardTitle,
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

export { Card, CardBody, CardCol, CardColSection, CardColTitle, CardDivider, CardFooter, CardFooterWrapper, CardIcon, CardTitle };
