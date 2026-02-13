// 	Avoid writing try...catch in every async route
// Higher-order function (takes a function, returns a function)
// Wraps handler in Promise.resolve(...).catch(next)
//	Automatically sends errors to Express error handler

const asyncHandler=(requestHandler)=>{
 return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
    // It catches errors in async functions and calls next(err) to pass them to Express.
  } 
}
 
export {asyncHandler};



// const asyncHandler = ()=>{}
// const asyncHandler = (fn)=>{()=>{}}
// const asyncHandler = (fn)=>()=>{}
// const asyncHandler = (fn)=>async()=>{}

// const asyncHandler = (fn)=>async(error,req,res,next)=>{
//     try{
//    await fn(error,req,res,next);
//     }
//     catch(error){
//      res.send(error.code || 500).json({
//         success:false,
//         message: error.message
//      })
//     }
// }