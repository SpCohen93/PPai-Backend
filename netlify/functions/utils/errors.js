"use strict";
/**
 * Error handling utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = createErrorResponse;
exports.logError = logError;
function createErrorResponse(message, statusCode = 500, error = 'Internal Server Error') {
    return {
        statusCode,
        body: JSON.stringify({
            error,
            message,
        }),
    };
}
function logError(error, context) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[${context}] Error:`, errorMessage);
    if (errorStack) {
        console.error(`[${context}] Stack:`, errorStack);
    }
}
