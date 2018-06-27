var lodash = require('lodash')
var highland = require('highland')

module.exports = function(getId){
  const kv = new Map()

  return {
    get:key=>kv.get(getId(key)),
    set:kv.set.bind(kv),
    has:key=>kv.has(getId(key)),
    delete:key=>kv.delete(getId(key)),
    values:kv.values.bind(kv),
    keys:kv.keys.bind(kv),
    entries:kv.entries.bind(kv),
    clear:kv.clear.bind(kv),
    forEach:kv.forEach.bind(kv),
    size:kv.size,
  }

}

