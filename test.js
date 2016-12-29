var test = require('tape')
var Memtable = require('.')

test('memtable',function(t){
  var table = null
  var resume = [
    {id:'0',name:'a',other:'zero',test:'a' },
    { id:'1',name:'b',other:'one' },
    { id:'2',name:'c',other:'two' }
  ]
  t.test('init',function(t){
    table = Memtable({
      resume:resume,
      unique:['name'],
      filterable:['other'],
    })
    t.ok(table)
    t.end()
  })
  t.test('init2',function(t){
    table = Memtable({
      resume:resume,
      unique:['name'],
      filterable:['other'],
      saveAll:true
    })
    t.ok(table)
    t.end()
  })
  t.test('list',function(t){
    table.list().then(function(result){
      t.deepEqual(resume,result)
      t.end()
    }).catch(t.end)
  })
  t.test('get',function(t){
    table.get('0').then(function(result){
      t.deepEqual(result,resume[0])
      t.end()
    }).catch(t.end)
  })
  t.test('getAll',function(t){
    table.getAll(['0','1']).then(function(result){
      t.equals(result.length,2)
      t.end()
    }).catch(t.end)
  })
  t.test('getBy',function(t){
    table.getBy('name','b').then(function(result){
      t.deepEqual(result,resume[1])
      t.end()
    }).catch(t.end)
  })
  t.test('getAllBy name',function(t){
    table.getAllBy('name',['b','c']).then(function(result){
      t.equals(result.length,2)
      t.end()
    }).catch(t.end)
  })
  t.test('filter',function(t){
    table.filter('ro').then(function(result){
      t.ok(result.length)
      t.deepEqual(result[0],resume[0])
      t.end()
    }).catch(t.end)
  })
  t.test('filter insensitive',function(t){
    table.filter('Wo',true).then(function(result){
      t.ok(result.length)
      t.deepEqual(result[0],resume[2])
      t.end()
    }).catch(t.end)
  })
  t.test('set',function(t){
    table.set({id:'3',name:'d',other:'three'}).then(function(result){
      t.ok(result)
      t.end()
    }).catch(t.end)
  })
})
