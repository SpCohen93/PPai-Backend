/**
 * Error handling utilities
 */

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  error: string = 'Internal Server Error'
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify({
      error,
      message,
    }),
  };
}

export function logError(error: unknown, context: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[${context}] Error:`, errorMessage);
  if (errorStack) {
    console.error(`[${context}] Stack:`, errorStack);
  }
}

