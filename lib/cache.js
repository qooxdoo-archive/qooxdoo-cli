'use strict';
const flatCache = require('flat-cache');

class Cache {
    constructor(cacheId) {
       this._cache = flatCache.load(cacheId);
    }
    
    get ( key ) {
        return this._cache.getKey(key);
    }
    
    set ( key, value ){
        this._cache.setKey( key, value );
        this._cache.save(true); 
    }
    
    clear (){
        this._cache.destroy();
    }
}
module.exports = Cache;
