/**
 * Created by tony on 3/15/17.
 */
'use strict'

// run a sequence of functions like fn(args..., next) where next is fn(err)
function runCallbacksInSequence(functions, cb){
    // last argument will pass to functions each time
    if(functions.length == 0){
       cb()
    }
    else {
      _recursiveRun(functions,0,cb)
    }

}

function _recursiveRun(functions, cursor, cb){
  functions[cursor]((err)=>{
    if(err){
      cb(err)
    }
    else {
      if(cursor < functions.length-1){
        _recursiveRun(functions,cursor+1,cb)
      }
      else {
       cb()
      }
      
    }
  })
  
  
}

/**
 * determine whether the host contains the the given creteria,
 * if value in creteria is array, then host must be array and contains all values in creteria array,
 * if value is RegExp then RegExp must apply to that field
 * if value is speical char like "<*>"=> any thing but not undefined
 * @param target
 * @param pattern
 * @private
 */
function patternMatch(target, pattern) {
  if(typeof pattern === "object"){
    // array
    if(Array.isArray(pattern)){
      if(!Array.isArray(target)){
        throw new Error(`to use Array structure compare, host must be array too`)
      }
      return pattern.every((itemCreteria)=>{
        return target.some((item)=>patternMatch(item,itemCreteria))
      })
    }
    //RegExp
    else if(pattern instanceof RegExp){
      if(typeof target === "object" && (target === null || target === undefined)){
        throw new Error(`to use RegExp strcuture compare, host should be string or number but was [${target}]`)
      }
      
      return pattern.test(target)
    }
    // object
    else {
      if(typeof target !== "object" || Array.isArray(target) || target instanceof RegExp){
        return false
      }
      return Object.keys(pattern).every((key)=>(patternMatch(target[key],pattern[key])))
    }
  }
  // others
  else {
    if(typeof pattern === "string"){
      if(pattern === "<any>"){
        return target !== undefined
      }
    }
    return target === pattern
  }
}


//test
// runCallbacksInSequence([
//   (cb)=>{
//     console.log(":1");
//     cb()
//   },
//   (cb)=>{
//     console.log(":2");
//     cb()
//   }
// ],function (err){
//     console.log("end");
//     console.log(err);
// })


module.exports = {
  runCallbacksInSequence,
  patternMatch
}