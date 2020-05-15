import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { IRoomTypeConfig } from './RoomTypeConfig';

interface IRoomTypesDictionary {
    [key: string]: IRoomTypeConfig;
}

interface IRoomTypeOrder {
    identifier: string;
    order: number;
}

export interface IRoomTypes {
    getTypesToShowOnDashboard(): string[];
    add(roomConfig: IRoomTypeConfig): void;
    hasCustomLink(roomType: string): boolean;
    getRouteLink(roomType: string, subData: any): string;
    getConfig(roomType: string): IRoomTypeConfig;
    getURL(roomType: string, subData: any): string;
    getRelativePath(roomType: string, subData: any): string;
    getRouteData(roomType: string, subData: any): { [key: string]: string } | undefined;
}

export abstract class RoomTypesCommon {
    protected roomTypes: IRoomTypesDictionary;
    protected roomTypesOrder: IRoomTypeOrder[];
    private mainOrder: number;

    protected constructor() {
        this.roomTypes = {};
        this.roomTypesOrder = [];
        this.mainOrder = 1;
    }

    getTypesToShowOnDashboard(): string[] {
        return Object.keys(this.roomTypes).filter((key) => this.roomTypes[key].includeInDashboard && this.roomTypes[key].includeInDashboard());
    }

    /**
     * Adds a room type to the application.
     *
     * @param {RoomTypeConfig} roomConfig
     * @returns {void}
     */
    add(roomConfig: IRoomTypeConfig): void {
        if (this.roomTypes[roomConfig.identifier]) {
            return;
        }

        if (!roomConfig.order) {
            roomConfig.order = this.mainOrder + 10;
            this.mainOrder += 10;
        }

        this.roomTypesOrder.push({
            identifier: roomConfig.identifier,
            order: roomConfig.order,
        });

        this.roomTypes[roomConfig.identifier] = roomConfig;

        if (roomConfig.route && roomConfig.route.path && roomConfig.route.name && roomConfig.route.action) {
            const routeConfig = {
                name: roomConfig.route.name,
                action: roomConfig.route.action,
                triggersExit: [() => Session.set('openedRoom', '')],
            };

            if (Meteor.isClient) {
                routeConfig.triggersExit = [roomConfig.onRoomExit];
            }

            return FlowRouter.route(roomConfig.route.path, routeConfig);
        }
    }

    hasCustomLink(roomType: string): boolean {
        return this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link != null;
    }

    /**
     * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
     * @param {object} subData the user's subscription data
     */
    getRouteLink(roomType: string, subData: any): string {
        const routeData = this.getRouteData(roomType, subData);
        if (!routeData) {
            return '';
        }

        return FlowRouter.path(this.roomTypes[roomType].route.name, routeData);
    }

    /**
     * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
     * @param {RoomTypeConfig} roomConfig room's type configuration
     */
    getConfig(roomType: string): IRoomTypeConfig {
        return this.roomTypes[roomType];
    }

    /**
     * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
     * @param {object} subData the user's subscription data
     */
    getURL(roomType: string, subData: any): string {
        const routeData = this.getRouteData(roomType, subData);
        if (!routeData) {
            return '';
        }

        return FlowRouter.url(this.roomTypes[roomType].route.name, routeData);
    }

    getRelativePath(roomType: string, subData: any): string {
        return this.getRouteLink(roomType, subData).replace(Meteor.absoluteUrl(), '');
    }

    getRouteData(roomType: string, subData: any): { [key: string]: string } | undefined {
        if (!this.roomTypes[roomType]) {
            return;
        }

        let routeData = {};
        if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
            // @ts-ignore
            routeData = this.roomTypes[roomType].route.link(subData);
        } else if (subData && subData.name) {
            routeData = {
                rid: subData.rid || subData._id,
                name: subData.name,
            };
        }

        return routeData;
    }
}
