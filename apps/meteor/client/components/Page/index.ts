import Page from './Page';
import PageContent from './PageContent';
import PageHeader from './PageHeader';
import PageScrollableContent from './PageScrollableContent';
import PageScrollableContentWithShadow from './PageScrollableContentWithShadow';

export default Object.assign(Page, {
	Header: PageHeader,
	Content: PageContent,
	ScrollableContent: PageScrollableContent,
	ScrollableContentWithShadow: PageScrollableContentWithShadow,
});
