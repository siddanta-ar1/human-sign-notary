// src/lib/aiDetector.ts
import { BiometricMetadata } from '@/types';

// Simulated Random Forest classifier for AI detection
export class AIDetector {
  // Feature extraction from biometric data
  static extractFeatures(metadata: BiometricMetadata) {
    const events = metadata.events;
    const keyEvents = events.filter(e => e.type === 'keydown');
    const pasteEvents = events.filter(e => e.type === 'paste');
    
    // Calculate timing features
    const timings = this.calculateTimings(keyEvents);
    const rhythmFeatures = this.calculateRhythmFeatures(timings);
    
    // Behavioral features
    const backspaceCount = events.filter(e => 
      e.type === 'keydown' && e.data.key === 'Backspace'
    ).length;
    
    const pasteLength = pasteEvents.reduce((sum, e) => 
      sum + (e.data.pasteLength || 0), 0
    );

    return {
      // Timing features
      avgKeyInterval: rhythmFeatures.avgInterval,
      timingVariance: rhythmFeatures.variance,
      maxPause: rhythmFeatures.maxPause,
      minPause: rhythmFeatures.minPause,
      
      // Behavioral features
      backspaceRatio: backspaceCount / Math.max(keyEvents.length, 1),
      pasteRatio: pasteLength / Math.max(metadata.finalText.length, 1),
      eventDensity: keyEvents.length / Math.max(metadata.finalText.length, 1),
      
      // Pattern features
      rhythmConsistency: rhythmFeatures.consistency,
      burstPattern: this.detectBurstPatterns(timings),
      thinkingPauses: rhythmFeatures.thinkingPauses,
      
      // Content features
      textComplexity: this.calculateTextComplexity(metadata.finalText),
      wordLengthVariance: this.calculateWordLengthVariance(metadata.finalText)
    };
  }

  // Calculate timing statistics
  private static calculateTimings(keyEvents: any[]) {
    const timings: number[] = [];
    for (let i = 1; i < keyEvents.length; i++) {
      const timing = keyEvents[i].timestamp - keyEvents[i-1].timestamp;
      if (timing > 0 && timing < 5000) {
        timings.push(timing);
      }
    }
    return timings;
  }

  // Calculate rhythm features
  private static calculateRhythmFeatures(timings: number[]) {
    if (timings.length === 0) {
      return {
        avgInterval: 0,
        variance: 0,
        maxPause: 0,
        minPause: 0,
        consistency: 0,
        thinkingPauses: 0
      };
    }

    const avgInterval = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = Math.sqrt(
      timings.map(t => Math.pow(t - avgInterval, 2)).reduce((a, b) => a + b, 0) / timings.length
    );
    
    const thinkingPauses = timings.filter(t => t > 1000).length;
    const consistency = variance / avgInterval; // Lower = more consistent (AI-like)

    return {
      avgInterval,
      variance,
      maxPause: Math.max(...timings),
      minPause: Math.min(...timings),
      consistency,
      thinkingPauses
    };
  }

  // Detect burst typing patterns (common in AI)
  private static detectBurstPatterns(timings: number[]): number {
    if (timings.length < 3) return 0;
    
    let burstCount = 0;
    for (let i = 2; i < timings.length; i++) {
      // Check for 3 consecutive fast keystrokes followed by a pause
      const isBurst = timings[i-2] < 100 && timings[i-1] < 100 && timings[i] > 500;
      if (isBurst) burstCount++;
    }
    
    return burstCount / (timings.length - 2);
  }

  // Calculate text complexity (AI text often has different complexity patterns)
  private static calculateTextComplexity(text: string): number {
    if (!text) return 0;
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.length > 0);
    
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const avgSentenceLength = words.length / sentences.length;
    
    // Complex text has longer words and sentences
    return (avgWordLength * 0.6) + (avgSentenceLength * 0.4);
  }

  // Calculate word length variance (human writing has more variance)
  private static calculateWordLengthVariance(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    
    const wordLengths = words.map(w => w.length);
    const avgLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const variance = wordLengths.map(l => Math.pow(l - avgLength, 2))
                              .reduce((a, b) => a + b, 0) / wordLengths.length;
    
    return Math.sqrt(variance);
  }

  // Simulated Random Forest prediction
  static predictAIProbability(features: any): number {
    // This is a simplified simulation of a trained Random Forest model
    // In production, this would be replaced with an actual ML model
    
    let aiScore = 0;
    
    // Timing consistency (AI is often too consistent)
    if (features.consistency < 0.3) aiScore += 25;
    else if (features.consistency < 0.5) aiScore += 15;
    
    // Burst patterns (AI often types in bursts)
    if (features.burstPattern > 0.1) aiScore += 20;
    
    // Lack of corrections (AI makes fewer mistakes)
    if (features.backspaceRatio < 0.02) aiScore += 15;
    
    // Paste operations (AI content is often pasted)
    if (features.pasteRatio > 0.1) aiScore += 20;
    
    // Event density (AI can have unnatural density)
    if (features.eventDensity > 2.0) aiScore += 10;
    
    // Thinking pauses (AI has fewer natural pauses)
    if (features.thinkingPauses < 2 && features.avgKeyInterval < 200) aiScore += 10;
    
    return Math.min(100, aiScore);
  }

  // Get detailed AI analysis
  static analyzeForAI(metadata: BiometricMetadata) {
    const features = this.extractFeatures(metadata);
    const aiProbability = this.predictAIProbability(features);
    
    const redFlags: string[] = [];
    
    if (features.consistency < 0.3) {
      redFlags.push('Extremely consistent typing rhythm detected');
    }
    if (features.burstPattern > 0.1) {
      redFlags.push('Burst typing pattern suggests automated input');
    }
    if (features.backspaceRatio < 0.02 && metadata.events.length > 50) {
      redFlags.push('Very few corrections made, unusual for human typing');
    }
    if (features.pasteRatio > 0.1) {
      redFlags.push('Significant paste operations detected');
    }
    if (features.thinkingPauses < 2 && metadata.events.length > 100) {
      redFlags.push('Lack of natural thinking pauses');
    }

    return {
      aiProbability,
      humanProbability: 100 - aiProbability,
      redFlags,
      features,
      confidence: Math.abs(aiProbability - 50) * 2 // Higher when clear signal
    };
  }
}