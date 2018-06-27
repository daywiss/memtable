const lodash = require('lodash')
const test = require('tape')
const times = require('lodash')
const utils = require('../utils')

const kv = new Map()
const size = 10

test('utils',t=>{
  t.test('init',t=>{
    lodash.times(size,i=>{
      kv.set('id'+i,i)
    })
    t.end()
  })
  t.test('each',t=>{
    t.plan(size*2)
    utils.each(kv.entries(),(v,k,i)=>{
      t.equal(v,i)
      t.equal(k,'id'+i)
    })
  })

  t.test('map',t=>{
    t.plan(size)
    const result = utils.map(kv.entries(),(v,k,i)=>{
      return k
    })
    result.forEach((k,i)=>{
      t.equal(k,'id'+i)
    })
  })
  t.test('map',t=>{
    t.plan(size/2)
    const result = utils.filter(kv.entries(),(v,k,i)=>{
      return v%2 == 0
    })
    result.forEach((v,i)=>{
      t.ok(v%2==0)
    })
  })
  t.test('reduce',t=>{
    t.plan(size)
    const result = utils.reduce(kv.entries(),(r,v,k,i)=>{
      r.push(k + v)
      return r
    },[])
    result.forEach((v,i)=>{
      t.equal(v,('id'+i)+i)
    })
  })
  t.test('lodash',t=>{
    const ld = utils.lodash(kv.values())
    t.equal(ld.head(),0)
    t.equal(ld.last(),size-1)
    t.end()
  })
  t.test('highland',t=>{
    const hl = utils.highland(kv.values())
    hl.toArray(result=>{
      t.equal(result.length,size)
      t.end()
    })
  })
  t.test('array',t=>{
    const result = utils.array(kv.values())
    t.equal(result.length,size)
    t.end()
  })
})
