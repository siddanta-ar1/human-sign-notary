// src/hooks/useBiometricCapture.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { KeystrokeEvent, BiometricMetadata, LiveStats, KeyTiming, EVENT_TYPES } from '@/types';

export const useBiometricCapture = () => {
  const [text, setText] = useState('');
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stats, setStats] = useState<LiveStats>({
    totalKeys: 0,
    backspaceCount: 0,
    pasteCount: 0,
    avgSpeed: 0,
    currentSpeed: 0,
    variance: 0,
    thinkingPauses: 0,
    sessionDuration: 0,
    lastKeyTiming: 0,
    typingRhythm: [],
    humanConfidence: 0
  });

  const sessionStartRef = useRef<number>(Date.now());
  const lastKeyTimeRef = useRef<number>(0);
  const keyTimingsRef = useRef<KeyTiming[]>([]);
  const backspaceCountRef = useRef<number>(0);
  const pasteCountRef = useRef<number>(0);

  // Create a new event
  const createEvent = useCallback((type: string, data: any): KeystrokeEvent => {
    return {
      id: crypto.randomUUID(),
      timestamp: performance.now(),
      absoluteTime: Date.now(),
      type,
      sessionId: 'session-' + sessionStartRef.current,
      data
    };
  }, []);

  // Calculate typing statistics
  const calculateStats = useCallback(() => {
    const now = Date.now();
    const sessionDuration = (now - sessionStartRef.current) / 1000; // in seconds
    
    // Calculate typing speed (WPM)
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const minutes = sessionDuration / 60;
    const currentSpeed = minutes > 0 ? Math.round(words / minutes) : 0;

    // Calculate rhythm variance
    const timings = keyTimingsRef.current.map(t => t.timing).filter(t => t > 0 && t < 5000); // Filter outliers
    const variance = timings.length > 1 
      ? Math.round((Math.std(timings) / Math.mean(timings)) * 100) 
      : 0;

    // Count thinking pauses (gaps > 1 second)
    const thinkingPauses = timings.filter(timing => timing > 1000).length;

    // Calculate human confidence score (0-100)
    const humanConfidence = calculateHumanConfidence(
      backspaceCountRef.current,
      pasteCountRef.current,
      variance,
      thinkingPauses,
      timings.length
    );

    setStats({
      totalKeys: events.filter(e => e.type === EVENT_TYPES.KEY_DOWN).length,
      backspaceCount: backspaceCountRef.current,
      pasteCount: pasteCountRef.current,
      avgSpeed: currentSpeed,
      currentSpeed,
      variance,
      thinkingPauses,
      sessionDuration: Math.round(sessionDuration),
      lastKeyTiming: timings[timings.length - 1] || 0,
      typingRhythm: timings.slice(-20), // Last 20 keystrokes
      humanConfidence
    });
  }, [text, events]);

  // Calculate human confidence score
  const calculateHumanConfidence = (
    backspaces: number,
    pastes: number,
    variance: number,
    pauses: number,
    totalKeys: number
  ): number => {
    let score = 100;

    // Penalize for too many pastes (AI content often pasted)
    if (pastes > 0) score -= pastes * 15;
    
    // Reward for moderate backspaces (humans make corrections)
    const backspaceRatio = totalKeys > 0 ? backspaces / totalKeys : 0;
    if (backspaceRatio > 0.05 && backspaceRatio < 0.2) score += 10;
    else if (backspaceRatio === 0) score -= 20; // No corrections suspicious
    
    // Reward for rhythm variance (humans have irregular timing)
    if (variance > 20 && variance < 80) score += 15;
    else if (variance <= 5) score -= 25; // Too consistent (robot-like)
    
    // Reward for thinking pauses
    if (pauses > 2) score += 10;

    return Math.max(0, Math.min(100, score));
  };

  // Handle key down events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const now = performance.now();
    const timing = lastKeyTimeRef.current > 0 ? now - lastKeyTimeRef.current : 0;
    lastKeyTimeRef.current = now;

    // Record key timing for rhythm analysis
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      keyTimingsRef.current.push({
        key: e.key,
        timestamp: now,
        timing
      });

      // Keep only last 100 timings for performance
      if (keyTimingsRef.current.length > 100) {
        keyTimingsRef.current = keyTimingsRef.current.slice(-100);
      }
    }

    // Count backspaces
    if (e.key === 'Backspace') {
      backspaceCountRef.current++;
    }

    const event = createEvent(EVENT_TYPES.KEY_DOWN, {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      selectionStart: (e.target as HTMLTextAreaElement).selectionStart,
      selectionEnd: (e.target as HTMLTextAreaElement).selectionEnd,
      currentText: (e.target as HTMLTextAreaElement).value,
      textLength: (e.target as HTMLTextAreaElement).value.length,
      wordCount: (e.target as HTMLTextAreaElement).value.split(/\s+/).filter(word => word.length > 0).length
    });

    setEvents(prev => [...prev, event]);
  }, [isCapturing, createEvent]);

  // Handle key up events
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const event = createEvent(EVENT_TYPES.KEY_UP, {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey
    });

    setEvents(prev => [...prev, event]);
  }, [isCapturing, createEvent]);

  // Handle paste events
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const pasteData = e.clipboardData.getData('text');
    pasteCountRef.current++;

    const event = createEvent(EVENT_TYPES.PASTE, {
      pasteData,
      pasteLength: pasteData.length,
      selectionStart: (e.target as HTMLTextAreaElement).selectionStart,
      selectionEnd: (e.target as HTMLTextAreaElement).selectionEnd,
      currentText: (e.target as HTMLTextAreaElement).value,
      textLength: (e.target as HTMLTextAreaElement).value.length
    });

    setEvents(prev => [...prev, event]);
    
    // Show warning for large pastes
    if (pasteData.length > 100) {
      console.warn('Large paste detected:', pasteData.length, 'characters');
    }
  }, [isCapturing, createEvent]);

  // Handle copy events
  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const event = createEvent(EVENT_TYPES.COPY, {
      selectionStart: (e.target as HTMLTextAreaElement).selectionStart,
      selectionEnd: (e.target as HTMLTextAreaElement).selectionEnd
    });

    setEvents(prev => [...prev, event]);
  }, [isCapturing, createEvent]);

  // Handle cut events
  const handleCut = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const event = createEvent(EVENT_TYPES.CUT, {
      selectionStart: (e.target as HTMLTextAreaElement).selectionStart,
      selectionEnd: (e.target as HTMLTextAreaElement).selectionEnd
    });

    setEvents(prev => [...prev, event]);
  }, [isCapturing, createEvent]);

  // Start capturing
  const startCapture = useCallback(() => {
    setIsCapturing(true);
    sessionStartRef.current = Date.now();
    lastKeyTimeRef.current = 0;
    keyTimingsRef.current = [];
    backspaceCountRef.current = 0;
    pasteCountRef.current = 0;
    setEvents([]);
  }, []);

  // Stop capturing
  const stopCapture = useCallback(() => {
    setIsCapturing(false);
  }, []);

  // Get biometric metadata
  const getBiometricMetadata = useCallback((): BiometricMetadata => {
    return {
      version: '1.0.0',
      events,
      sessionStart: sessionStartRef.current,
      sessionId: 'session-' + sessionStartRef.current,
      contentHash: null, // Will be set when creating the file
      signature: null, // Will be set when creating the file
      finalText: text
    };
  }, [events, text]);

  // Update stats when events or text changes
  useEffect(() => {
    if (isCapturing) {
      calculateStats();
    }
  }, [events, text, isCapturing, calculateStats]);

  return {
    text,
    setText,
    events,
    stats,
    isCapturing,
    startCapture,
    stopCapture,
    handleKeyDown,
    handleKeyUp,
    handlePaste,
    handleCopy,
    handleCut,
    getBiometricMetadata
  };
};

// Add Math extensions for statistical calculations
declare global {
  interface Math {
    mean(array: number[]): number;
    std(array: number[]): number;
  }
}

Math.mean = function(array: number[]): number {
  return array.reduce((a, b) => a + b, 0) / array.length;
};

Math.std = function(array: number[]): number {
  const mean = Math.mean(array);
  return Math.sqrt(array.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / array.length);
};