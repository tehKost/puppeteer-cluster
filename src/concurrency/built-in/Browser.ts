
import * as puppeteer from 'puppeteer';

import { debugGenerator, timeoutExecute } from '../../util';
import ConcurrencyImplementation, { WorkerInstance } from '../ConcurrencyImplementation';
const debug = debugGenerator('BrowserConcurrency');

const BROWSER_TIMEOUT = 5000;

export default class Browser extends ConcurrencyImplementation {
    public async init() {}
    public async close() {}

    public async workerInstance(): Promise<WorkerInstance> {
        let chrome: puppeteer.Browser;
        let page: puppeteer.Page;

        return {
            jobInstance: async (proxy) => {
                this.options.args = [
                    '--no-sandbox',
                    `--proxy-server=${proxy}`,
                ]
                chrome = await this.puppeteer.launch(this.options);
                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    // page = await chrome.newPage();
                    let pages = await chrome.pages()
                    page = pages[0]
                })());

                return {
                    resources: {
                        page,
                    },

                    close: async () => {
                        try {await chrome.close();} catch (e) {}
                        // await timeoutExecute(BROWSER_TIMEOUT, chrome.close());
                    },
                };
            },

            close: async () => {
                try {await chrome.close();} catch (e) {}
            },

            repair: async () => {
                debug('Starting repair');
                try {await chrome.close();} catch (e) {}

                // just relaunch as there is only one page per browser
                chrome = await this.puppeteer.launch(this.options);
            },
        };
    }

}
