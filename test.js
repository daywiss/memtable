var test = require('tape')
var Memtable = require('.')
var lodash = require('lodash')

test('memtable',function(t){
  var table = null
  var resume = [
    {id:0,name:'a',other:'zero',test:'aa' },
    { id:'1',name:'b',other:'one',test:'b' },
    { id:'2',name:'c',other:'two',test:'c'  }
  ]
  t.test('init',function(t){
    table = Memtable({
      resume:resume,
      secondary:['name'],
      filterable:['other'],
    })
    t.ok(table)
    t.end()
  })
  t.test('init2',function(t){
    table = Memtable({
      resume:resume,
      primary:['id','name'],
      secondary:['name','other',['other','test']],
      searchable:['other'],
      saveAll:true,
      warn:false
    })
    t.ok(table)
    t.end()
  })
  t.test('list',function(t){
    var result = table.list()
    t.deepEqual(resume,result)
    t.end()
  })
  t.test('get',function(t){
    var result = table.get('0.a')
    t.deepEqual(result,resume[0])
    t.end()
  })
  t.test('getAll',function(t){
    var result = table.getAll([['0','a'],['1','b']])
    t.equals(result.length,2)
    t.end()
  })
  t.test('getBy',function(t){
    var result = table.getBy('name','b')
    t.deepEqual(result,resume[1])
    t.end()
  })
  t.test('getBy composite',function(t){
    var result = table.getBy(['other','test'],['one','b'])
    t.deepEqual(result,resume[1])
    t.end()
  })
  t.test('getAllBy name',function(t){
    var result = table.getAllBy('name',['b','c'])
    t.equals(result.length,2)
    t.end()
  })
  t.test('search',function(t){
    var result = table.search('ro')
    t.ok(result.length)
    t.deepEqual(result[0],resume[0])
    t.end()
  })
  t.test('search insensitive',function(t){
    var result = table.search('Wo',true)
    t.ok(result.length)
    t.deepEqual(result[0],resume[2])
    t.end()
  })
  t.test('filter test',function(t){
    var result = table.filter({test:'aa'})
    t.ok(result.length)
    t.end()
  })
  t.test('filter func',function(t){
    var result = table.filter(function(val){
      return val.name == 'c'
    })
    t.equals(result.length, 1)
    t.end()
  })
  t.test('lodash shortcuts',function(t){
    table.map(function(){})
    table.each(function(){})
    table.reduce(function(){},{})
    t.end()
  })

  t.test('set',function(t){
    var result = table.set({id:'3',name:'d',other:'three'})
    t.ok(result)
    t.end()
  })

  t.test('set',function(t){
    console.log(table.list())
    var result = table.set({id:'2',name:'c',other:2})
    t.ok(result)
    t.end()
  })

  t.test('setAll',function(t){
    var list = [
      {id:'3',name:'d',other:'three'},
      {id:'4',name:'e',other:'flour',test:'four'},
      {id:'4',name:'e',other:'four'},
      {id:'5',name:'f',other:'five'}
    ]
    var result = table.setAll(list)
    t.equal(result.length,4)
    t.equal(table.list().length,6)
    t.end()
  })
  t.test('has',function(t){
    var result = table.has(['4','e'])
    t.ok(result)
    t.end()
  })
  t.test('hasBy',function(t){
    var result = table.hasBy('name','e')
    t.ok(result)
    t.end()
  })
  t.test('hasAll',function(t){
    var result = table.hasAll(['1.b','2.c','3.d'])
    t.ok(lodash.every(result,Boolean),true)
    t.end()
  })
  t.test('hasAllBy',function(t){
    var result = table.hasAllBy('name',['a','c','e'])
    t.ok(lodash.every(result,Boolean),true)
    t.end()
  })
  t.test('list',function(t){
    var result = table.list()
    t.ok(result.length)
    t.end()
  })
  t.test('lodash',function(t){
    t.plan(2*table.list().length)
    table.lodash().each(t.ok)
    table.lodash(true).each(t.ok)
  })

  t.test('highland',function(t){
    t.plan(2*table.list().length)
    table.highland().each(t.ok)
    table.highland(true).each(t.ok)
  })

  t.test('getPrimaryID',function(t){
    var result = table.getPrimaryID(table.get('1.b'))
    t.equal(result,'1.b')
    t.end()
  })

  t.test('conflict',function(t){
    try{
      t.end(table.set({
        id:'conflict', name:'a',other:'zero',test:'aa'
      }))
    }catch(e){
      t.ok(e)
      t.end()
    }
  })

  t.test('update',function(t){
    var result = table.update('1.b',{'blah':'blah',test:'bb'})
    t.equal('blah',result.blah)
    t.equal('bb',result.test)
    t.deepEqual(result,table.get('1.b'))
    t.end()
  })

  t.test('update conflict',function(t){
    try{
      t.end(table.updateBy('name','c',{'other':'four'}))
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('update primary ',function(t){
    try{
      t.end(table.update('2.c',{'name':'cc'}))
    }catch(e){
      t.ok(e)
      t.end()
    }
  })
  t.test('update secondary',function(t){
    var result = table.update(['4','e'],{id:'4',name:'e',other:'roses',test:'four'})
    var compare = table.getBy('other','roses')
    t.equal(compare.other,'roses')
    try{
      table.getBy('other','flour')
    }catch(e){
      t.ok(e)
    }
    t.ok(result)
    t.end()
  })

  t.test('remove',function(t){
    var result = table.remove([0,'a'])
    t.ok(result)
    t.end()
  })
  t.test('remove all',function(t){
    var result = table.removeAll(['1.b','2.c'])
    t.ok(result.length)
    t.end()
  })
  t.test('drop',function(t){
    var result = table.drop()
    lodash.each(table.state(),function(value){
      t.deepEqual(value,{})
    })
    t.end()
  })

  t.test('secondary index test',function(t){
    var table = Memtable({
      secondary:['name']
    })
    table.set({
      id:'testa',name:'blah1'
    })
    table.set({
      id:'testa',name:'blah2'
    })
    table.update('testa',{
      name:'blah3'
    })
    var result = table.set({
      id:'testb',name:'blah1'
    })

    try{
      t.notOk(table.getBy('name','blah2'))
      // console.log(table.getBy('name','blah2'))
      // return t.end('should not get value')
    }catch(e){
      t.ok(e)
    }
    t.ok(table.get('testa'))
    t.ok(table.get('testb'))
    t.ok(table.getBy('name','blah1'))
    t.ok(table.getBy('name','blah3'))

    t.ok(result)
    t.end()
  })

})
