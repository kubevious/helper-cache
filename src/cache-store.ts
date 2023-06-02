import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { MyPromise, Resolvable } from 'the-promise';
import { LRUCache } from 'lru-cache';

export class CacheStore<K = any, V extends object = object>
{
    private _logger : ILogger;
    private _cache : LRUCache<string, V>;
    private _params : CacheStoreParams;
    private _interval? : NodeJS.Timeout;

    constructor(logger : ILogger, params?: Partial<CacheStoreParams>)
    {
        this._logger = logger;

        params = params || {};
        this._params = {
            size: params.size || 1000,
            maxAgeMs: params.maxAgeMs || undefined
        };

        this._cache = new LRUCache<string, V>({
            max: this._params.size,
            ttl: this._params.maxAgeMs
        });

        // if (this._params.maxAgeMs)
        // {
        //     this._interval = setInterval(() => {
        //         // this._logger.info("PRUNE");
        //         this._cache.prune();
        //     }, this._params.maxAgeMs / 2);
        // }
    }

    close()
    {
        if (this._interval) {
            clearInterval(this._interval!)
            this._interval = undefined;
        }
        this._cache.clear();
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

    dynamicGet(key: K, cb: (key : K) => Resolvable<V>) : Promise<V | undefined>
    {
        const value = this.get(key);
        if (!_.isUndefined(value)) {
            return Promise.resolve(value!);
        }
        
        return MyPromise.try(() => cb(key))
            .then(newValue => {
                if (!_.isUndefined(newValue)) {
                    this.set(key, newValue);
                }
                return newValue;
            })
    }

    fetcher(cb: (key : K) => Resolvable<V>) : CacheStoreFetcher<K, V>
    {
        return {
            get: (key: K) => {
                const value = this.get(key);
                if (!_.isUndefined(value)) {
                    return Promise.resolve(value!);
                }
                return MyPromise.try(() => cb(key))
                    .then(newValue => {
                        if (!_.isUndefined(newValue)) {
                            this.set(key, newValue);
                        }
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

export interface CacheStoreFetcher<K = any, V = any>
{
    get(key: K) : Promise<V>;
}

export interface CacheStoreParams
{
    size: number,
    maxAgeMs?: number;
}