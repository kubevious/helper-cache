import 'mocha';
import should = require('should');
import _ from 'the-lodash';
import { CacheStore }  from '../src';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

describe("cache", function() {

    it('case1', function() {

        const cache = new CacheStore(logger);
        
    })

});
