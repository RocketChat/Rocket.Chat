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

export { Card, CardBody, CardCol, CardColSection, CardColTitle, CardDivider, CardFooter, CardFooterWrapper, CardIcon, CardTitle };

export default Object.assign(Card, {
	/**
	 * @deprecated Use named import `CardTitle` instead
	 */
	Title: CardTitle,
	/**
	 * @deprecated Use named import `CardBody` instead
	 */
	Body: CardBody,
	/**
	 * @deprecated Use named import `CardCol` instead
	 */
	Col: Object.assign(CardCol, {
		/**
		 * @deprecated Use named import `CardColTitle` instead
		 */
		Title: CardColTitle,
		/**
		 * @deprecated Use named import `CardColSection` instead
		 */
		Section: CardColSection,
	}),
	/**
	 * @deprecated Use named import `CardFooter` instead
	 */
	Footer: CardFooter,
	/**
	 * @deprecated Use named import `CardFooterWrapper` instead
	 */
	FooterWrapper: CardFooterWrapper,
	/**
	 * @deprecated Use named import `CardDivider` instead
	 */
	Divider: CardDivider,
	/**
	 * @deprecated Use named import `CardIcon` instead
	 */
	Icon: CardIcon,
});
