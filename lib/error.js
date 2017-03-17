/**
 * Created by tony on 3/15/17.
 */
'use strict'
class HanbaoError extends Error{
  constructor(message,data){
    super(message)
    this.data = data
  }
}




module.exports = HanbaoError