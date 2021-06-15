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
        cache.set('foo', 'bar');

        should(cache.get('foo')).be.equal('bar');

        cache.set({'foo' : 'bar'}, 'bar1');
        cache.set({'bar' : 'foo'}, 'bar2');

        should(cache.get({'foo' : 'bar'})).be.equal('bar1');
        should(cache.get({'bar' : 'foo'})).be.equal('bar2');
    })

    it('fetcher1', function() {

        const cache = new CacheStore<string, string>(logger);
        const fetcher = cache.fetcher((key) => `XX${key}`);

        return fetcher.get('foo')
            .then(value => {
                should(value).be.equal('XXfoo');
            });
    })

});
