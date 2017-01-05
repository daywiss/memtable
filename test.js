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
      composite:[['other','test']],
    })
    t.ok(table)
    t.end()
  })
  t.test('init2',function(t){
    table = Memtable({
      resume:resume,
      secondary:['name'],
      filterable:['other'],
      composite:[['other','test']],
      saveAll:true
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
    var result = table.get('0')
    t.deepEqual(result,resume[0])
    t.end()
  })
  t.test('getAll',function(t){
    var result = table.getAll(['0','1'])
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
  t.test('filter',function(t){
    var result = table.filter('ro')
    t.ok(result.length)
    t.deepEqual(result[0],resume[0])
    t.end()
  })
  t.test('filter insensitive',function(t){
    var result = table.filter('Wo',true)
    t.ok(result.length)
    t.deepEqual(result[0],resume[2])
    t.end()
  })
  t.test('filter by test',function(t){
    var result = table.filterBy('test','a')
    t.ok(result.length)
    t.end()
  })
  t.test('set',function(t){
    var result = table.set({id:'3',name:'d',other:'three'})
    t.ok(result)
    t.end()
  })
  t.test('setAll',function(t){
    var list = [
      {id:'3',name:'d',other:'three'},
      {id:'4',name:'e',other:'four'},
      {id:'5',name:'f',other:'five'}
    ]
    var result = table.setAll(list)
    t.equal(result.length,3)
    t.end()
  })
  t.test('has',function(t){
    var result = table.has('4')
    t.ok(result)
    t.end()
  })
  t.test('hasBy',function(t){
    var result = table.hasBy('name','e')
    t.ok(result)
    t.end()
  })
  t.test('hasAll',function(t){
    var result = table.hasAll(['1','2','3'])
    t.ok(result.length,3)
    t.end()
  })
  t.test('hasAllBy',function(t){
    var result = table.hasAllBy('name',['a','c','e'])
    t.ok(result.length,3)
    t.end()
  })
  t.test('list',function(t){
    var result = table.list()
    t.ok(result.length)
    t.end()
  })
  t.test('remove',function(t){
    var result = table.remove(0)
    t.ok(result)
    t.end()
  })
  t.test('remove all',function(t){
    var result = table.removeAll(['1','2'])
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
})
