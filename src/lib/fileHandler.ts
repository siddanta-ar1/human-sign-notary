// src/lib/fileHandler.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BiometricMetadata, KeystrokeEvent } from '@/types';
import { SecurityUtils } from './securityUtils';

// Crypto utilities for hashing and signing
export class CryptoUtils {
  // Generate a SHA-256 hash of the content
  static async createHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.bufferToHex(hashBuffer);
  }

  // Convert ArrayBuffer to hex string
  private static bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate a signature for the metadata
  static async createSignature(metadata: BiometricMetadata, secretKey: string): Promise<string> {
    const signatureData = {
      sessionId: metadata.sessionId,
      contentHash: metadata.contentHash,
      eventCount: metadata.events.length,
      finalTextLength: metadata.finalText.length,
      timestamp: Date.now()
    };
    
    const signatureString = JSON.stringify(signatureData) + secretKey;
    return await this.createHash(signatureString);
  }

  // Verify a signature
  static async verifySignature(
    metadata: BiometricMetadata, 
    signature: string, 
    secretKey: string
  ): Promise<boolean> {
    const expectedSignature = await this.createSignature(metadata, secretKey);
    return signature === expectedSignature;
  }
}

// File creation utilities
export class FileHandler {
  // Create a unique secret key for this session
  static generateSecretKey(): string {
    const randomPart = crypto.randomUUID().replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    return `hs_${timestamp}_${randomPart}`.slice(0, 32);
  }

  // Pre-process events for analysis
  static preProcessEvents(events: KeystrokeEvent[]): any {
    const keyEvents = events.filter(e => e.type === 'keydown' || e.type === 'keyup');
    const pasteEvents = events.filter(e => e.type === 'paste');
    
    // Calculate timing statistics
    const keyDownEvents = events.filter(e => e.type === 'keydown');
    const timings: number[] = [];
    
    for (let i = 1; i < keyDownEvents.length; i++) {
      const timing = keyDownEvents[i].timestamp - keyDownEvents[i-1].timestamp;
      if (timing > 0 && timing < 5000) { // Filter outliers
        timings.push(timing);
      }
    }

    return {
      totalEvents: events.length,
      keyEvents: keyEvents.length,
      pasteEvents: pasteEvents.length,
      backspaceCount: events.filter(e => e.type === 'keydown' && e.data.key === 'Backspace').length,
      averageTiming: timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0,
      timingVariance: this.calculateVariance(timings),
      sessionDuration: events.length > 0 ? 
        (events[events.length - 1].absoluteTime - events[0].absoluteTime) / 1000 : 0
    };
  }

  // Calculate variance of an array of numbers
  private static calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.round(variance * 100) / 100;
  }

  // Analyze the biometric data for human/AI detection
  static analyzeBiometrics(metadata: BiometricMetadata): any {
    const processed = this.preProcessEvents(metadata.events);
    
    let humanScore = 100;
    const anomalies: string[] = [];

    // Check for paste events
    if (processed.pasteEvents > 0) {
      humanScore -= processed.pasteEvents * 10;
      anomalies.push(`Detected ${processed.pasteEvents} paste events`);
    }

    // Check timing consistency (too consistent = AI-like)
    if (processed.timingVariance < 10 && processed.keyEvents > 20) {
      humanScore -= 30;
      anomalies.push('Extremely consistent typing rhythm detected');
    }

    // Check for unnatural speed
    const avgSpeed = processed.keyEvents / Math.max(processed.sessionDuration, 1);
    if (avgSpeed > 15) { // Very high speed
      humanScore -= 20;
      anomalies.push('Unusually high typing speed detected');
    }

    // Check backspace ratio
    const backspaceRatio = processed.backspaceCount / Math.max(processed.keyEvents, 1);
    if (backspaceRatio < 0.02 && processed.keyEvents > 50) {
      humanScore -= 15;
      anomalies.push('Very few corrections made');
    }

    // Determine verdict
    let verdict = 'UNKNOWN';
    if (humanScore >= 80) verdict = 'VERIFIED_HUMAN';
    else if (humanScore >= 60) verdict = 'LIKELY_HUMAN';
    else if (humanScore >= 40) verdict = 'SUSPICIOUS';
    else if (humanScore >= 20) verdict = 'LIKELY_AI';
    else verdict = 'DETECTED_AI';

    return {
      humanScore: Math.max(0, Math.min(100, humanScore)),
      verdict,
      anomalies,
      metrics: processed,
      analysisTimestamp: Date.now()
    };
  }

  // Create the .humansign ZIP file
  static async createHumanSignFile(
    text: string, 
    metadata: BiometricMetadata, 
    filename: string = `document-${Date.now()}.humansign`
  ): Promise<Blob> {
    const zip = new JSZip();
    
    // Generate secret key for this session
    const secretKey = this.generateSecretKey();
    
    // Calculate content hash
    const contentHash = await CryptoUtils.createHash(text);
    metadata.contentHash = contentHash;
    
    // Create signature
    const signature = await CryptoUtils.createSignature(metadata, secretKey);
    metadata.signature = signature;

    // Analyze the biometrics
    const analysis = this.analyzeBiometrics(metadata);

    // Create manifest
    const manifest = {
      version: '1.0.0',
      format: 'HUMANSIGN_V1',
      created: new Date().toISOString(),
      sessionId: metadata.sessionId,
      contentHash,
      signature,
      analysis,
      fileInfo: {
        textLength: text.length,
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        eventCount: metadata.events.length,
        sessionDuration: analysis.metrics.sessionDuration
      }
    };

    // Add files to ZIP
    zip.file('content.txt', text);
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('PROOF.md', this.generateProofMarkdown(manifest, analysis));

    // Generate ZIP blob
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }

  // Generate human-readable proof markdown
  private static generateProofMarkdown(manifest: any, analysis: any): string {
    return `# HumanSign Proof Document

## Document Information
- **Created**: ${new Date(manifest.created).toLocaleString()}
- **Session ID**: ${manifest.sessionId}
- **Content Hash**: ${manifest.contentHash}
- **Signature**: ${manifest.signature.slice(0, 16)}...

## Biometric Analysis
- **Human Confidence Score**: ${analysis.humanScore}%
- **Verdict**: ${analysis.verdict.replace(/_/g, ' ')}
- **Total Keystrokes**: ${analysis.metrics.keyEvents}
- **Session Duration**: ${analysis.metrics.sessionDuration.toFixed(1)} seconds
- **Typing Variance**: ${analysis.metrics.timingVariance.toFixed(2)}

## Statistics
- **Text Length**: ${manifest.fileInfo.textLength} characters
- **Word Count**: ${manifest.fileInfo.wordCount} words
- **Backspace Count**: ${analysis.metrics.backspaceCount}
- **Paste Events**: ${analysis.metrics.pasteEvents}

## Anomalies Detected
${analysis.anomalies.length > 0 
  ? analysis.anomalies.map((a: string) => `- ⚠️ ${a}`).join('\n') 
  : '- ✅ No significant anomalies detected'
}

---
*This document was cryptographically signed by HumanSign Keystroke Notary*
*Verification: Upload this .humansign file to the HumanSign Decoder for validation*`;
  }

  // Download the .humansign file
  static async downloadHumanSignFile(
    text: string,
    metadata: BiometricMetadata,
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.createHumanSignFile(text, metadata, filename);
      saveAs(blob, filename || `document-${Date.now()}.humansign`);
    } catch (error) {
      console.error('Error creating HumanSign file:', error);
      throw new Error('Failed to create download file');
    }
  }

  // Enhanced file reading with security checks
  static async readHumanSignFile(file: File): Promise<{
    text: string;
    metadata: BiometricMetadata;
    manifest: any;
  }> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // Security: Check file size limits
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large');
      }

      // Read the files
      const text = await zipContent.file('content.txt')?.async('text') || '';
      const metadataText = await zipContent.file('metadata.json')?.async('text') || '{}';
      const manifestText = await zipContent.file('manifest.json')?.async('text') || '{}';
      
      const metadata = JSON.parse(metadataText);
      const manifest = JSON.parse(manifestText);

      // Security validations
      if (!SecurityUtils.validateEventStructure(metadata.events)) {
        throw new Error('Invalid event structure');
      }

      if (SecurityUtils.detectTimestampManipulation(metadata.events)) {
        throw new Error('Timestamp manipulation detected');
      }

      if (SecurityUtils.isReplayAttack(metadata)) {
        throw new Error('Possible replay attack detected');
      }

      // Sanitize content for display
      const sanitizedText = SecurityUtils.sanitizeContent(text);
      
      return { text: sanitizedText, metadata, manifest };
    } catch (error) {
      console.error('Error reading HumanSign file:', error);
      throw new Error('Invalid or malicious HumanSign file');
    }
  }
}