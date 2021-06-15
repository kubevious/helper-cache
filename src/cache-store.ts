import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise, Resolvable } from 'the-promise';
import { default as LRUCache } from 'lru-cache';

export class CacheStore<K = any, V = any>
{
    private _cache : LRUCache<string, V>;

    constructor(logger : ILogger)
    {
        this._cache = new LRUCache();
    }

    set(key: K, value: V)
    {
        const k = this._rawKey(key);
        this._cache.set(k, value);
    }

    get(key: K) : V | undefined
    {
        const k = this._rawKey(key);
        return this._cache.get(k);
    }

    fetcher(cb: (key : K) => Resolvable<V>)
    {
        return {
            get: (key: K) => {
                const value = this.get(key);
                if (!_.isUndefined(value)) {
                    return Promise.resolve(value!);
                }
                return Promise.try(() => cb(key))
                    .then(newValue => {
                        console.log(newValue);
                        this.set(key, newValue);
                        return newValue;
                    })
            }
        }
    }

    private _rawKey(key: K)
    {
        if (_.isString(key)) {
            return key;
        }
        return _.stableStringify(key);
    }
     
}