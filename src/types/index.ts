// src/types/index.ts

// Core data structures for our biometric logging
export const EVENT_TYPES = {
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup', 
  PASTE: 'paste',
  COPY: 'copy',
  CUT: 'cut',
  FOCUS: 'focus',
  BLUR: 'blur'
} as const;

export const CONTENT_TYPES = {
  HUMAN_TYPED: 'human_typed',
  AI_GENERATED: 'ai_generated',
  PASTED: 'pasted',
  MIXED: 'mixed',
  UNKNOWN: 'unknown'
} as const;

export const VERDICT_TYPES = {
  VERIFIED_HUMAN: 'verified_human',
  AI_DETECTED: 'ai_detected',
  PASTE_DETECTED: 'paste_detected',
  MIXED_CONTENT: 'mixed_content',
  INVALID: 'invalid'
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];
export type VerdictType = typeof VERDICT_TYPES[keyof typeof VERDICT_TYPES];

// Main event log structure
export interface KeystrokeEvent {
  id: string;
  timestamp: number;
  absoluteTime: number;
  type: EventType;
  sessionId: string;
  data: {
    key?: string;
    code?: string;
    keyCode?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    pasteData?: string;
    pasteLength?: number;
    selectionStart?: number;
    selectionEnd?: number;
    currentText?: string;
    textLength?: number;
    wordCount?: number;
  };
}

// Biometric metadata structure
export interface BiometricMetadata {
  version: string;
  events: KeystrokeEvent[];
  sessionStart: number;
  sessionId: string;
  contentHash: string | null;
  signature: string | null;
  finalText: string;
}

// Analysis results structure
export interface AnalysisResult {
  verdict: VerdictType;
  confidence: number;
  contentType: ContentType;
  heuristicScore: number;
  mlScore: number;
  cryptoValid: boolean;
  tamperDetected: boolean;
  detailedBreakdown: Record<string, any>;
  biometricStats: Record<string, any>;
  anomalies: string[];
}

// Stats for live dashboard
export interface LiveStats {
  totalKeys: number;
  backspaceCount: number;
  pasteCount: number;
  avgSpeed: number;
  currentSpeed: number;
  variance: number;
  thinkingPauses: number;
  sessionDuration: number;
  lastKeyTiming: number;
  typingRhythm: number[];
  humanConfidence: number;
}

// Key timing structure for rhythm analysis
export interface KeyTiming {
  key: string;
  timestamp: number;
  timing: number; // Time since last keypress
}

// File and crypto types
export interface HumanSignManifest {
  version: string;
  format: string;
  created: string;
  sessionId: string;
  contentHash: string;
  signature: string;
  analysis: {
    humanScore: number;
    verdict: string;
    anomalies: string[];
    metrics: any;
    analysisTimestamp: number;
  };
  fileInfo: {
    textLength: number;
    wordCount: number;
    eventCount: number;
    sessionDuration: number;
  };
}

export interface FileAnalysisResult {
  isValid: boolean;
  isTampered: boolean;
  humanScore: number;
  verdict: string;
  anomalies: string[];
  manifest: HumanSignManifest | null;
  metadata: BiometricMetadata | null;
  content: string;
  biometricAnalysis?: any;
  aiAnalysis?: any;

}
