import 'mocha';
import should from 'should';
import _ from 'the-lodash';
import { CacheStore }  from '../src';
import { setupLogger, LoggerOptions } from 'the-logger';
import { MyPromise } from 'the-promise'

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

describe("cache", function() {

    it('simple-case-1', function() {

        const cache = new CacheStore(logger);
        cache.set('foo', ['bar']);

        should(cache.get('foo')).be.eql(['bar']);

        cache.set({'foo' : 'bar'}, ['bar1']);
        cache.set({'bar' : 'foo'}, ['bar2']);

        should(cache.get({'foo' : 'bar'})).be.eql(['bar1']);
        should(cache.get({'bar' : 'foo'})).be.eql(['bar2']);
    })

    it('max-size-default', function() {

        const cache = new CacheStore(logger);

        const CACHE_SIZE = 1000;
        const COUNT = 10000;

        for(let i = 0; i < COUNT; i++)
        {
            cache.set(`foo${i}`, [`bar${i}`]);
        }

        let setCount = 0;
        let unsetCount = 0;
        for(let i = 0; i < COUNT; i++)
        {
            const value = cache.get(`foo${i}`);
            if (value) {
                setCount ++;
            } else {
                unsetCount ++;
            }
        }

        should(setCount).be.equal(CACHE_SIZE);
        should(unsetCount).be.equal(COUNT - CACHE_SIZE);
    })

    it('max-size-custom', function() {

        const CACHE_SIZE = 500;

        const cache = new CacheStore(logger, {
            size: CACHE_SIZE
        });
        
        const COUNT = 2000;

        for(let i = 0; i < COUNT; i++)
        {
            cache.set(`foo${i}`, [`bar${i}`]);
        }

        let setCount = 0;
        let unsetCount = 0;
        for(let i = 0; i < COUNT; i++)
        {
            const value = cache.get(`foo${i}`);
            if (value) {
                setCount ++;
            } else {
                unsetCount ++;
            }
        }

        should(setCount).be.equal(CACHE_SIZE);
        should(unsetCount).be.equal(COUNT - CACHE_SIZE);
    })

    it('fetcher1', function() {

        const cache = new CacheStore<string, string[]>(logger);
        const fetcher = cache.fetcher((key) => [`XX${key}`]);

        return fetcher.get('foo')
            .then(value => {
                should(value).be.eql(['XXfoo']);
            });
    })


    it('fetcher-scale', function() {

        let fetchCount = 0;

        const CACHE_SIZE = 100;

        const cache = new CacheStore<string, string[]>(logger, {
            size: CACHE_SIZE
        });

        const fetcher = cache.fetcher((key) => {
            fetchCount ++ 
            const value = `value-${key}`;
            return [value];
        });

        const COUNT = 1000;
        const range = Array.from(Buffer.alloc(COUNT).keys());
        return MyPromise.serial(range, index => {
            return fetcher.get(`foo-${index}`)
                .then(value => {
                    should(value).be.eql([`value-foo-${index}`]);
                })
        })
        .then(() => {
            should(fetchCount).be.equal(COUNT);
        })
        .then(() => {
            return MyPromise.serial(_.reverse(range), index => {
                return fetcher.get(`foo-${index}`)
                    .then(value => {
                        should(value).be.eql([`value-foo-${index}`]);
                    })
            })
        })
        .then(() => {
            should(fetchCount).be.equal(COUNT + COUNT - CACHE_SIZE);
        })
    })

    it('max-age', function() {

        const cache = new CacheStore<string, string[]>(logger, {
            maxAgeMs: 100,
        });

        return Promise.resolve()
            .then(() => cache.set('foo1', ['bar1']))
            .then(() => {
                const value = cache.get('foo1');
                should(value).be.eql(['bar1']);
            })
            .then(() => MyPromise.delay(500))
            .then(() => {
                const value = cache.get('foo1');
                should(value).be.undefined();
            })
            .then(() => cache.close());
    })


    it('dynamic-get-1', function() {

        const cache = new CacheStore(logger);

        let counter = 0;
        
        return Promise.resolve()
            .then(() => {
                return cache.dynamicGet("foo-1", (key) => [`bar-${key}`] )
            })
            .then(result => {
                should(result).be.eql([`bar-foo-1`]);
            })
            .then(() => {
                return cache.dynamicGet("foo-1", (key) => {
                    counter ++;
                    return [`XXX-${key}`]
                } )
            })
            .then(result => {
                should(result).be.eql([`bar-foo-1`]);
                should(counter).be.equal(0);
            })

    })


    it('complex-key', function() {

        const cache = new CacheStore(logger);

        cache.set({'foo' : 'bar'}, ['bar']);
        should(cache.get({'foo' : 'bar'})).be.eql(['bar']);
        should(cache.get({'foo1' : 'bar'})).be.undefined();

        cache.set({'foo1' : 'bar1', 'foo2' : 'bar1'}, ['bar1']);
        should(cache.get({'foo1' : 'bar1', 'foo2' : 'bar1'})).be.eql(['bar1']);
        should(cache.get({'foo2' : 'bar1', 'foo1' : 'bar1'})).be.eql(['bar1']);

    })

});
