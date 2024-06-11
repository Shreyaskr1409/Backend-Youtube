class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        // array of errors
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        // research about this.data
        this.message = message
        this.success = false
        this.errors = errors
        // errors... not error


        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
        // This code can be usually avoided
        // stack to tell where which files will be affected from errors
    }
}

export {ApiError}