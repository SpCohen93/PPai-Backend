"use strict";
/**
 * License validation utility
 *
 * For now, this validates against a whitelist from environment variables.
 * Later, you can extend this to check against Stripe, a database, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLicense = validateLicense;
exports.extractToken = extractToken;
/**
 * Validates a license token from the Authorization header
 *
 * @param token - The token from Authorization: Bearer <token>
 * @returns Validation result
 */
function validateLicense(token) {
    if (!token) {
        return { valid: false, reason: 'Missing authorization token' };
    }
    // Get whitelist from environment variable (comma-separated)
    const whitelist = process.env.LICENSE_TOKENS?.split(',').map(t => t.trim()) || [];
    // For development, allow empty whitelist (you may want to remove this)
    if (whitelist.length === 0 && process.env.NODE_ENV === 'development') {
        console.warn('No LICENSE_TOKENS set - allowing all requests in development');
        return { valid: true };
    }
    if (whitelist.includes(token)) {
        return { valid: true };
    }
    return { valid: false, reason: 'Invalid license token' };
}
/**
 * Extracts the token from Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The token or null
 */
function extractToken(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
