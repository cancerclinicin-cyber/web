// Simple encryption/decryption utilities for URL parameters
// Note: This is a basic implementation for demo purposes
// In production, use a more secure encryption method

import config from '../../../configLoader';

const SECRET_KEY = config.ENCRYPTION_KEY || 'mediconnect-appointment-key-2024';

export const encryptId = (id: string | number): string => {
  try {
    const text = id.toString();
    // Create a simple encoded string with prefix for identification
    const prefixed = `enc_${text}_${SECRET_KEY}`;
    const encoded = btoa(prefixed);
    // Make URL-safe by replacing problematic characters
    const urlSafe = encoded
      .replace(/=/g, '')
      .replace(/\//g, '-')
      .replace(/\+/g, '_');
    return urlSafe;
  } catch (error) {
    console.error('Encryption error:', error);
    return id.toString();
  }
};

export const decryptId = (encryptedId: string): string => {
  try {
    // Restore URL-safe characters
    let normalized = encryptedId
      .replace(/-/g, '/')
      .replace(/_/g, '+');

    // Add padding back
    const padding = (4 - normalized.length % 4) % 4;
    normalized += '='.repeat(padding);

    const decoded = atob(normalized);

    // Check if it's our encrypted format
    if (decoded.startsWith('enc_') && decoded.includes(`_${SECRET_KEY}`)) {
      // Extract the ID between 'enc_' and the SECRET_KEY
      const withoutPrefix = decoded.replace('enc_', '');
      const id = withoutPrefix.split(`_${SECRET_KEY}`)[0];
      return id;
    }

    // Fallback: try to extract numeric ID
    const match = decoded.match(/(\d+)/);
    return match ? match[1] : encryptedId;
  } catch (error) {
    console.error('Decryption error:', error);
    // Try to extract numeric ID as fallback
    const match = encryptedId.match(/(\d+)/);
    return match ? match[1] : encryptedId;
  }
};