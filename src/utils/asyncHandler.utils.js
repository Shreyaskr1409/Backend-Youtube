const asyncHandler = (requestHandler) => {
    // we have to return this function... not execute this function
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}




/*
const asyncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(res, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
        // this err is from (err, req, res, next)
    }
}
*/



export {asyncHandler}