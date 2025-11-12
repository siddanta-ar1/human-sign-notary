// src/lib/securityUtils.ts
export class SecurityUtils {
  // Prevent replay attacks by checking timestamps
  static isReplayAttack(metadata: any, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    const fileAge = Date.now() - metadata.sessionStart;
    return fileAge > maxAge; // Files older than 24 hours are suspicious
  }

  // Check for timestamp manipulation
  static detectTimestampManipulation(events: any[]): boolean {
    if (events.length < 2) return false;

    // Check for non-sequential timestamps
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp < events[i-1].timestamp) {
        return true;
      }
    }

    // Check for unrealistic timestamps (future dates)
    const now = Date.now();
    if (events.some(event => event.absoluteTime > now + 60000)) { // 1 minute in future
      return true;
    }

    return false;
  }

  // Validate event structure to prevent injection attacks
  static validateEventStructure(events: any[]): boolean {
    return events.every(event => 
      event.id &&
      event.timestamp &&
      event.absoluteTime &&
      event.type &&
      event.sessionId &&
      event.data &&
      typeof event.timestamp === 'number' &&
      typeof event.absoluteTime === 'number'
    );
  }

  // Sanitize file content to prevent XSS
  static sanitizeContent(content: string): string {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}