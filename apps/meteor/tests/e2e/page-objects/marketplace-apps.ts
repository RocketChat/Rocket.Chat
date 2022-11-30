import type { Locator, Page } from '@playwright/test';
import { HomeSidenav } from './fragments';
import { OmnichannelSidenav } from './fragments';

export class MarketPlace {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;
    readonly homsidenav: HomeSidenav
    
	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
        this. homsidenav = new HomeSidenav(page);
    }

    get apps(): Locator {
		return this.page.locator('a[href="/admin/marketplace"]');
	}

    get exploreMarket(): Locator {
        return this.page.locator('//button[contains(text(),"Explore Marketplace")]');
    }

    get settings(): Locator {
        return this.page.locator('//div[contains(text(),"Settings")]');
    }

    public async installApp(isexploreMarket = true): Promise<void> {
		const buttonLabel = isexploreMarket ? 'Explore Marketplace' : 'Upload App';
			if (isexploreMarket) {
			await this.settings.click();
            await this.page.locator('[placeholder="Search"]').fill('General');
            await this.page.locator('[data-qa-id="General"] > div >button').click();
            await this.page.locator('//h1[contains(text(),"Apps")]').click();
            await this.page.locator('[data-qa-setting-id="Apps_Framework_Development_Mode"]').click();
            await this.page.locator('//button[text()="Save changes"]').click();
            }
            await this.apps.locator('//div[@class="rcx-box rcx-box--full rcx-css-10ij0kz"]//following::button[@class="rcx-box rcx-box--full rcx-button--small-square rcx-button--square rcx-button--icon rcx-button"]').click();
            await this.homsidenav.openInstalledApps();
        }
		
	}