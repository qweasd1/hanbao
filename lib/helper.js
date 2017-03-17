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
  runCallbacksInSequence
}