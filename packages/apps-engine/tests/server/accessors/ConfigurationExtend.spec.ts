import { Expect, SetupFixture, Test } from 'alsatian';

import type {
    IApiExtend,
    IExternalComponentsExtend,
    IHttpExtend,
    ISchedulerExtend,
    ISettingsExtend,
    ISlashCommandsExtend,
    IUIExtend,
    IVideoConfProvidersExtend,
} from '../../../src/definition/accessors';
import { ConfigurationExtend } from '../../../src/server/accessors';

export class ConfigurationExtendTestFixture {
    private he: IHttpExtend;

    private se: ISettingsExtend;

    private sce: ISlashCommandsExtend;

    private api: IApiExtend;

    private externalComponent: IExternalComponentsExtend;

    private schedulerExtend: ISchedulerExtend;

    private uiExtend: IUIExtend;

    private vcProvidersExtend: IVideoConfProvidersExtend;

    @SetupFixture
    public setupFixture() {
        this.he = {} as IHttpExtend;
        this.se = {} as ISettingsExtend;
        this.sce = {} as ISlashCommandsExtend;
        this.api = {} as IApiExtend;
        this.externalComponent = {} as IExternalComponentsExtend;
        this.schedulerExtend = {} as ISchedulerExtend;
        this.uiExtend = {} as IUIExtend;
        this.vcProvidersExtend = {} as IVideoConfProvidersExtend;
    }

    @Test()
    public useConfigurationExtend() {
        Expect(
            () =>
                new ConfigurationExtend(
                    this.he,
                    this.se,
                    this.sce,
                    this.api,
                    this.externalComponent,
                    this.schedulerExtend,
                    this.uiExtend,
                    this.vcProvidersExtend,
                ),
        ).not.toThrow();

        const se = new ConfigurationExtend(
            this.he,
            this.se,
            this.sce,
            this.api,
            this.externalComponent,
            this.schedulerExtend,
            this.uiExtend,
            this.vcProvidersExtend,
        );
        Expect(se.http).toBeDefined();
        Expect(se.settings).toBeDefined();
        Expect(se.slashCommands).toBeDefined();
        Expect(se.externalComponents).toBeDefined();
        Expect(se.videoConfProviders).toBeDefined();
    }
}
