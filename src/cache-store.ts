import { ILogger } from 'the-logger';
import * as LRU from 'lru-cache';


export class CacheStore
{
    constructor(logger : ILogger)
    {
        const cache = new LRU.default();
    }

}