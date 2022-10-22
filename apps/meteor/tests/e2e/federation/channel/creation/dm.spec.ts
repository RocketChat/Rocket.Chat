import { test, expect } from '@playwright/test';
import * as constants from '../config/constants'


test.describe.parallel('Federation - Channel Creation', () => {
    test.describe('Direct Message', () => {

        test.describe('Using the DM Modal creation', () => {

            test.describe('Create a DM with an user from the Server B who does not exist in Server A yet', () => {

            });

            test.describe('Create a DM with an user from the Server B who already exist in Server A', () => {

            });

            test.describe('DM Multiple', () => {
                test.describe('Create a DM with an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

                });

                test.describe('Create a DM with an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

                });
            })
        });

        test.describe('Using slash commands', () => {

            test.describe('Create a DM with an user from the Server B who does not exist in Server A yet', () => {

            });

            test.describe('Create a DM with an user from the Server B who already exist in Server A', () => {

            });

            test.describe('DM Multiple', () => {

                test.describe('Create a DM with an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

                });

                test.describe('Create a DM with an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

                });
            });

        });
    });

});

test.describe.parallel('Federation - Channel creation - From server B (CE)', () => {

    test.describe('Direct Message', () => {

        test.describe('Using slash commands', () => {

            test.describe('Create a DM with an user from the Server B who does not exist in Server A yet', () => {

            });

            test.describe('Create a DM with an user from the Server B who already exist in Server A', () => {

            });

            test.describe('DM Multiple', () => {

                test.describe('Should not be possible', () => {

                });

            });

        });
    });

});
