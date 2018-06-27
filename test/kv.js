var test = require('tape')
var KV = require('../kv')

test('kv',t=>{
  t.test('init',t=>{
    kv = KV(x=>x)
    t.ok(kv)
    t.end()
  })
  t.test('set',t=>{
    kv = KV(x=>x)
    kv.set('id',1)
    t.equal(1,kv.get('id'))
    t.end()
  })
  t.test('has',t=>{
    kv = KV(x=>x)
    kv.set('id',1)
    t.ok(kv.has('id'))
    t.end()
  })
  t.test('delete',t=>{
    kv = KV(x=>x)
    kv.set('id',1)
    kv.delete('id',1)
    t.notOk(kv.has('id'))
    t.end()
  })
  t.test('values',t=>{
    kv = KV(x=>x)
    kv.set('id',1)
    t.equal(kv.values().next().value,1)
    t.end()
  })
  t.test('keys',t=>{
    kv = KV(x=>x)
    kv.set('id',1)
    t.equal(kv.keys().next().value,'id')
    t.end()
  })
})
