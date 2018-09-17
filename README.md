# MemTable
A data cache with similar operations to a database but in memory with syncronous calls. 
Adds unique/non-unique data indexing and data querying using standard lodash (syncronous)
and highland (asyncronous streams) on top of standard JS iterators. Use in conjunction
with permament data store by watching for data mutations on change handler.

# Install
`npm install memtable`

# Why
Cache your data with powerful indexing and querying capabilities built on JS iterators, [lodash](https://lodash.com) and
node streams using [highland-js](https://highlandjs.org). Query data with very little overhead. Memtable supports unique and non unique 
indexes, secondary and compound indexes.  entries. Data is kept internally in native Set and Map structures. 
Listen to memtable changes to syncronize data back to a persistent data store. 

# v2.0
Version 2 brings non-unique and required indexes, functional indexes, named indexes and more robust index queries. You
now must specify the name of the index, and can provide objects, arrays, functions or strings to query your indexed data.
This version uses ES6 iterators and stores data in native Sets and Maps. Event emitter depedency has been
removed for a single top level callback to watch for changes on the table. Cache warming is done by passing data
through to setSilent to prevent events from triggering rather than passing the data set in on construction. There is also now
a pre-save hook to allow for mutations or data validations before saving data.

# Basic Usage

```js
  const Table = require('memtable')
  const {validateUser} = require('./myuserschema')

  //all options optional
  const usersTable = Table({
    //primary index, defaults to id, must be unique
    primary:{index:'id',required:true,unique:true}, 
    //See index section for more information on defining secondary indexes
    indexes:[{ 
      //this will throw errors if uniqueness property required constraints are violated before saving
      {name:'login',required:true,unique:true,index:'login'},
      {name:'email',required:false,unique:true,index:'email'},
      {name:'name',required:false,unique:false,index:'name'},
    }],
    //Pre save hook, allows for mutations, side effects or validations
    preSet:x=>{
      //validate data
      validateUser(x)
      //clone our data so it does not get modified outside table
      x = lodash.clone(x)
      //always make sure we have an updated timestamp before saving
      x.updated = Date.now()
      return x
    }
  })

  //sets user data in table 
  let user =users.set({
    id:'id0',
    name:'david',
    email:'david@example.com ',
    login:'david',
  })

  //returns user, but a version of the user missing unnecessary props
  user = users.get('id0')

  //query table by "login" property and return a single result
  user = users.getBy('login','david')
  //query table by "email" property and return a single result
  user = users.getBy('email','david@example.com')

  //returns all users in an iterator
  const allUsers = users.values()

  //returns true, since primary id exists in table
  var exists = users.has('id0')

``` 

# Restore and Persist data
Basic example of how to "warm" the  memtable cache from database, then watch
for changes on memtable to send changes back to database.

```js

   //assume we have a user model that uses promises to persist data to database
   var UserDb = require('./PersistentUserModel')
   var Table = require('memtable')

   //keep store eventually consistent with memory model
   //for better consistency, persist data asyncronously, then update memtable on success.
   function handleChange({type,value,prev,update,indexes}){
     switch(type){
       case 'set':
         return UserDb.set(value)
       case 'update':
         return UserDb.update(update)
       case 'remove':
         return UserDb.remove(value)
     }
   }

   //pass change handler on init, or call listen(cb) 
   const userCache = Table({
     indexes:{name:'email',index:'email'}
   },handleChange)

   //this is equivalent to change handler on init, 
   //only one listener will every be registered though
   userCache.listen(handleChange)

   //initialize memtable cache from persistent storage
   //set silent will prevent change handler from firing during init
   UserDb.readStream().on('data',userCache.setSilent).on('end',()=>{
     //cache is ready to go, changes will be propogated back to the db
     userCache.values ...
   })

``` 

# Advanced Indexes
Memtable is pretty flexible with data indexes, this is how to use some of the more advanced features.

``` js
  //lets define some advanced secondary indexes for a user
  const indexes = [
    //compound index
    {
      name:'fullname',
      index:['first','last'],
      required:false,unique:false
      
    },
    //uses a function to both validate email address and form it to some
    //standard representation
    { 
      name:'saf',
      index: email => validateAndSanitizeEmail(email),
      required:true, unique:true,
    }
  ]

``` 


# Querying



# API

## Initialization Options
```js
var Table = require('memtable')
table = Table(options)
``` 
```js
  //default option values
  options = {
    primary:'id' //default primary key property, objects must at least have this property defined
    secondary:[], //list secondary indexable properties as strings, must be unique
    searchable:[], //properties which can be partially searched
    required:[], //list of required properties. will throw error if object is set without one.
    resume:[], //array of table objects to resume from
    save:[], //properties on object to always store in memory, but not to index or filter on
    saveAll:false, //save entire object in memory rather than just primary/unique/filterable props. Only do if you know objects are small. 
    onChange:function(x, primaryid){ return x}, //this function will get called after memory is set
    onRemove:function(x, primaryid){ return x}, //this function will get called after memory is deleted
  }
``` 
## Set
Save object to table, or replace existing object. Will trigger onChange callback. Will throw if required properties are not set. Will
also throw if unique secondary id collides with another item already in table. 

```js
  //add a single object, returns the object back. Throws if required properties are not defined.
  var result = table.set(object)

  //add an array of objects, returns the list of objects back
  var result = table.setAll(objects)
```

## Update
Update properties on an existing item in the table. Will throw if trying to update primary key(s).
Will merge properties into the existing object in the table and trigger onChange callback.

```js
  //update item with the primaryid, returns the updated object.
  var result = table.update('primaryid',propsToUpdate)

  //update item by secondary id, specify the secondary key, secondary id and the updates to make
  var result = table.updateBy('secondarykey','secondaryid',propsToUpdate)
```

## Get
Get an object from table. Will throw if object does not exist.
```js
  //get object by primary id, returns the stored object. 
  var result = table.get(primaryid)

  //get objects by a list of primary ids
  var result = table.getAll(primaryids)

  //get an object by secondary id, returns stored object.
  var result = table.getBy(property,secondaryid)

  //get objects by a list of secondary ids
  var result = table.getAllBy(property,secondaryids)

  //get object by composite id. Must specify composite id as an array of values
  //Must specify the values to search as an array in the same order as the ids
  var result = table.getBy(['prop1','prop2'],['compositevalue1','compositevalue2'])

  //get a list of objects by composit ids. specify array of composite values.
  var result = table.getAllBy(['prop1','prop2'],[['compositevalue1','compositevalue2']])

```

## Has
Check if an object exists in the table. Will never throw. returns only true or false for each object checked.

```js
  //"has" will always return true or false, will not throw
  //result is true if object with id "primaryid" exists 
  var result = table.has('primaryid')
   
  //check if object exists by secondary unique property, will not throw 
  //result is true if object with secondary id "secondaryid" exists 
  var result = table.hasBy('uniquepropname','uniqueid')

  //check if list of ids exist, will not throw
  //result is array of true/false values
  var result = table.hasAll(listofids)

  //check if list of unique secondary ids exist, will not throw
  //result is array of true/false values
  var result = table.hasAllBy('uniquepropname',listofuniqueids)

  //check if object exists by composite id
  var result = table.hasBy(['prop1','prop2'],['objectprop1','objectprop2'])

  //check if a list of objects exist by composite ids
  var result = table.hasAllBy(['prop1','prop2'],[['objectprop1','objectprop2']])
```

## Remove
Remove an object from memory and trigger onRemove callback. Throws if object does not exist. Each remove returns the object removed.

```js
  //remove object by primary id
  var result = table.remove(primaryid)

  //remove objects by list of primary ids
  var result = table.removeAll(primaryids)

  //remove object by secondary id
  var result = table.removeBy(property,secondaryid)

  //remove objects by list of secondaryids
  var result = table.removeAllBy(property,secondaryids)

  //remove object by composite id. Must specify composite id as an array of values
  var result = table.removeBy(['prop1','prop2'],['compositevalue1','compositevalue2'])

  //remove objects by composite ids. specify array of array of composite values.
  var result = table.removeAllBy(['prop1','prop2'],[['compositevalue1','compositevalue2']])
```

## Map, Filter, Reduce, Each, Sort
Internally uses [lodash's]( https://www.lodash.com) "map", "filter", "reduce" and "each" functions over the entire table.  You can accomplish the same thing
with "list" getting all the data as an array, but this saves you an iteration over the table. Order of iteration is not gauranteed.

```js
  //filter over all items in table, returns an array of items which filter returned true for
  //see lodash filter
  var result = table.filter(function(item){
    //returns a list of items who pass this check
    return item.name == 'some name'
  })

  //map over all items in table, returns an array of mapped values
  //see lodash map
  var result = table.map(function(item){ 
    //returns just the ids in an array
    return item.id
  })

  //reduce over all items in table, with optional second paramter to seed the reduce
  //see lodash reduce
  var result = table.reduce(function(result,item){
    //sums all item.amount values, starting at 0.
    return result + item.amount
  },0)

  //iterate over all items in table, for side effects.
  // see lodash each
  table.each(function(item){
    //do something with item
  })

  //returns sorted array where you specify the properties to sort by
  //specify 'asc' or 'desc' to change sort order, default is ascending
  //see lodash orderBy
  var result = table.sort(['age'],['desc'])

```

## Search
Search over specified "searchable" properties in each item in the table. Case sensitive or insensitive. Partial matches returned. For custom search
use table.filter and define your own.
```js
  //specify partial search and filters all objects which match. Must have specified them as "searchable" in initialization properties.
  var result = table.search('de')
```

##Lodash Sequence
Wrap table in a lodash sequence, letting you chain commands. Must call value at end to get results. Syncronous operations.
See [lodash](https://www.lodash.com)
```js
  //wraps just table values
  var result = table.lodash().filter(...).map(...).value()

  //if you want primary keys and values use this
  //which will wrap they primary table object and return value,key
  var result = table.lodash(true).map(function(value,key){
  }).value()


```

## Highland Streams
Wrap the table in a highland stream, which gives you access to the node stream api as well as highlands api. Asyncronous operations.
See [highland](http://highlandjs.org)
```js  
  //highland is a node compatible stream which emits values from the table one by one
  table.highland().map(function(value){
    //return modified value
  }).filter(function(value){
    //filter out values
  }).toArray(function(result){
    //get results as an array
  })

  //if you want key value pairs do this:
  table.highland(true).each(function(pair){
    //just calls highland.pairs(table) under the hood.
    //key = pair[0]
    //value = pair[1]
  })

```


## Drop
Clear the table. Does not return anything
```js
  table.drop()
```

## List
Get an array of all objects in the table.
```js
  var result = table.list()
```

## State
Get the entire table state as an object. Will include all secondary and composite indexes.
```js
  //returns an object which represents the table in memory
  var result = table.state()
```



