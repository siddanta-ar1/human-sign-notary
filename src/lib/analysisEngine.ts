// src/lib/analysisEngine.ts
import { BiometricMetadata, HumanSignManifest, FileAnalysisResult, VERDICT_TYPES, CONTENT_TYPES } from '@/types';
import { CryptoUtils, FileHandler } from './fileHandler';
import { AIDetector } from './aiDetector';

export class AnalysisEngine {
  // Analyze a HumanSign file and return comprehensive results
  static async analyzeHumanSignFile(file: File): Promise<FileAnalysisResult> {
    try {
      // Read the file contents
      const { text, metadata, manifest } = await FileHandler.readHumanSignFile(file);
      
      // Verify cryptographic integrity
      const cryptoValid = await this.verifyCryptographicIntegrity(metadata, manifest);
      
      // Check for tampering
      const isTampered = await this.detectTampering(metadata, manifest, text);
      
      // Analyze biometric patterns
      const biometricAnalysis = FileHandler.analyzeBiometrics(metadata);
      
      // Perform advanced AI detection
      const aiAnalysis = AIDetector.analyzeForAI(metadata);
      
      // Combine AI analysis with biometric analysis
      const combinedHumanScore = Math.max(0, biometricAnalysis.humanScore - aiAnalysis.aiProbability);
      
      // Determine final verdict
      const verdict = this.determineEnhancedVerdict(combinedHumanScore, cryptoValid, isTampered, aiAnalysis);
      
      // Combine anomalies
      const allAnomalies = [...biometricAnalysis.anomalies, ...aiAnalysis.redFlags];

      return {
        isValid: cryptoValid && !isTampered,
        isTampered,
        humanScore: combinedHumanScore,
        verdict,
        anomalies: allAnomalies,
        manifest,
        metadata,
        content: text,
        biometricAnalysis, // Include biometric analysis
        aiAnalysis // Include AI analysis in results
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error('Failed to analyze file');
    }
  }

  // Verify cryptographic integrity
  private static async verifyCryptographicIntegrity(
    metadata: BiometricMetadata,
    manifest: HumanSignManifest
  ): Promise<{ isTampered: boolean; warnings: string[] }> {
    if (!manifest.signature || !manifest.contentHash) {
      return false;
    }

    try {
      // Verify content hash matches
      const currentHash = await CryptoUtils.createHash(metadata.finalText);
      if (currentHash !== manifest.contentHash) {
        return false;
      }

      // In a real implementation, we would verify the signature against a known key
      // For demo purposes, we'll simulate signature verification
      const simulatedKey = 'human_sign_demo_key_2024';
      const signatureValid = await CryptoUtils.verifySignature(metadata, manifest.signature, simulatedKey);
      
      return signatureValid;
    } catch (error) {
      return false;
    }
  }

  // Detect potential tampering
  private static async detectTampering(
    metadata: BiometricMetadata,
    manifest: HumanSignManifest,
    content: string
  ): Promise<boolean> {
    const warnings: string[] = [];

    // Check event consistency
    if (metadata.events.length === 0) {
      warnings.push('No biometric events recorded');
    }

    // Check timestamp anomalies
    const sessionDuration = metadata.events.length > 0 
      ? (metadata.events[metadata.events.length - 1].absoluteTime - metadata.events[0].absoluteTime) 
      : 0;
    
    if (sessionDuration < 1000 && metadata.events.length > 50) {
      warnings.push('Unnaturally fast typing detected');
    }

    // Check for event gaps that might indicate tampering
    const eventGaps = AnalysisEngine.analyzeEventGaps(metadata.events);
    if (eventGaps.hasSuspiciousGaps) {
      warnings.push('Suspicious timing gaps in events');
    }

    // Check content vs events consistency
    const contentFromEvents = AnalysisEngine.reconstructContentFromEvents(metadata.events);
    if (contentFromEvents !== content) {
      warnings.push('Content does not match recorded events');
    }

    // Check for duplicate timestamps (common in fabricated data)
    const duplicateTimestamps = AnalysisEngine.checkDuplicateTimestamps(metadata.events);
    if (duplicateTimestamps) {
      warnings.push('Duplicate timestamps detected - possible data fabrication');
    }

    // Check for unrealistic timing patterns
    const timingAnalysis = AnalysisEngine.analyzeTimingPatterns(metadata.events);
    if (timingAnalysis.unrealistic) {
      warnings.push('Unrealistic timing patterns detected');
    }

    // Verify event sequence integrity
    if (!AnalysisEngine.verifyEventSequence(metadata.events)) {
      warnings.push('Event sequence integrity compromised');
    }

    return warnings.length > 0;
  }

  // Analyze gaps between events for tampering detection
  private static analyzeEventGaps(events: any[]): { hasSuspiciousGaps: boolean; gaps: number[] } {
    const gaps: number[] = [];
    let hasSuspiciousGaps = false;

    for (let i = 1; i < events.length; i++) {
      const gap = events[i].timestamp - events[i - 1].timestamp;
      gaps.push(gap);

      // Gaps longer than 30 seconds might indicate tampering
      if (gap > 30000) {
        hasSuspiciousGaps = true;
      }
    }

    return { hasSuspiciousGaps, gaps };
  }

  // Reconstruct content from events to verify consistency
  private static reconstructContentFromEvents(events: any[]): string {
    let reconstructed = '';
    const keyEvents = events.filter(e => e.type === 'keydown' && e.data.key && e.data.key.length === 1);
    
    for (const event of keyEvents) {
      reconstructed += event.data.key;
    }

    return reconstructed;
  }

  // Check for duplicate timestamps
  private static checkDuplicateTimestamps(events: any[]): boolean {
    const timestamps = events.map(e => e.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    return uniqueTimestamps.size !== timestamps.length;
  }

  // Analyze timing patterns for unrealistic behavior
  private static analyzeTimingPatterns(events: any[]): { unrealistic: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let unrealistic = false;

    const keyEvents = events.filter(e => e.type === 'keydown');
    const timings: number[] = [];

    for (let i = 1; i < keyEvents.length; i++) {
      const timing = keyEvents[i].timestamp - keyEvents[i-1].timestamp;
      timings.push(timing);
    }

    // Check for superhuman speed (<10ms between keys)
    const superhumanCount = timings.filter(t => t < 10).length;
    if (superhumanCount > 5) {
      unrealistic = true;
      reasons.push(`Superhuman typing speed detected (${superhumanCount} instances)`);
    }

    // Check for perfect rhythm (unnatural consistency)
    if (timings.length > 10) {
      const variance = this.calculateStd(timings);
      const mean = this.calculateMean(timings);
      const coefficient = variance / mean;
      
      if (coefficient < 0.1) {
        unrealistic = true;
        reasons.push('Perfect rhythm consistency - unnatural for humans');
      }
    }

    return { unrealistic, reasons };
  }

  // Calculate mean of numbers
  private static calculateMean(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Calculate standard deviation of numbers
  private static calculateStd(numbers: number[]): number {
    const mean = this.calculateMean(numbers);
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // Verify event sequence makes sense
  private static verifyEventSequence(events: any[]): boolean {
    for (let i = 0; i < events.length - 1; i++) {
      // Timestamps should be increasing
      if (events[i].timestamp > events[i + 1].timestamp) {
        return false;
      }
    }
    return true;
  }

  // Enhanced verdict determination with AI detection
  private static determineEnhancedVerdict(
    humanScore: number,
    cryptoValid: boolean,
    isTampered: boolean,
    aiAnalysis: any
  ): string {
    if (!cryptoValid) return VERDICT_TYPES.INVALID;
    if (isTampered) return VERDICT_TYPES.INVALID;
    
    // Use AI analysis to adjust thresholds
    let adjustedScore = humanScore;
    if (aiAnalysis.aiProbability > 70) {
      adjustedScore -= 30; // Strong AI signal heavily penalizes
    } else if (aiAnalysis.aiProbability > 50) {
      adjustedScore -= 15; // Moderate AI signal
    }
    
    if (adjustedScore >= 75) return VERDICT_TYPES.VERIFIED_HUMAN;
    if (adjustedScore >= 50) return VERDICT_TYPES.MIXED_CONTENT;
    if (adjustedScore >= 25) return VERDICT_TYPES.PASTE_DETECTED;
    
    return VERDICT_TYPES.AI_DETECTED;
  }

  // Get detailed analysis breakdown
  static getDetailedBreakdown(analysis: FileAnalysisResult) {
    const { metadata, manifest, biometricAnalysis, aiAnalysis } = analysis;

    return {
      cryptographic: {
        valid: analysis.isValid,
        contentHash: manifest?.contentHash,
        signature: manifest?.signature?.slice(0, 16) + '...',
        verifiedAt: new Date().toISOString()
      },
      biometric: {
        totalEvents: metadata?.events.length || 0,
        sessionDuration: manifest?.fileInfo.sessionDuration || 0,
        typingSpeed: Math.round((metadata?.events.length || 0) / Math.max(manifest?.fileInfo.sessionDuration || 1, 1)),
        rhythmVariance: biometricAnalysis?.metrics.timingVariance || 0,
        correctionRate: biometricAnalysis?.metrics.backspaceCount / Math.max(metadata?.events.length || 1, 1)
      },
      content: {
        length: manifest?.fileInfo.textLength || 0,
        wordCount: manifest?.fileInfo.wordCount || 0,
        pasteEvents: biometricAnalysis?.metrics.pasteEvents || 0,
        contentType: this.determineContentType(analysis)
      },
      aiDetection: aiAnalysis || {}
    };
  }

  // Determine content type based on analysis
  private static determineContentType(analysis: FileAnalysisResult): string {
    if (analysis.verdict === VERDICT_TYPES.VERIFIED_HUMAN) return CONTENT_TYPES.HUMAN_TYPED;
    if (analysis.verdict === VERDICT_TYPES.AI_DETECTED) return CONTENT_TYPES.AI_GENERATED;
    if (analysis.biometricAnalysis?.pasteEvents > 0) return CONTENT_TYPES.PASTED;
    return CONTENT_TYPES.MIXED;
  }
}