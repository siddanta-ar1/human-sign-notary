// src/components/NotaryPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, Activity, Clock, Type, MousePointer, AlertTriangle, CheckCircle, FileDown } from 'lucide-react';
import { useBiometricCapture } from '@/hooks/useBiometricCapture';
import { FileHandler } from '@/lib/fileHandler';

export default function NotaryPage() {
  const {
    text,
    setText,
    stats,
    events,
    isCapturing,
    startCapture,
    handleKeyDown,
    handleKeyUp,
    handlePaste,
    handleCopy,
    handleCut,
    getBiometricMetadata
  } = useBiometricCapture();

  const [hasStarted, setHasStarted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Auto-start capture when user starts typing
  useEffect(() => {
    if (!hasStarted && text.length > 0) {
      startCapture();
      setHasStarted(true);
    }
  }, [text, hasStarted, startCapture]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleDownload = async () => {
    if (text.length === 0) return;
    
    setIsDownloading(true);
    setDownloadStatus('processing');
    
    try {
      const metadata = getBiometricMetadata();
      await FileHandler.downloadHumanSignFile(text, metadata);
      
      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getDownloadButtonText = () => {
    switch (downloadStatus) {
      case 'processing': return 'Creating File...';
      case 'success': return 'Download Complete!';
      case 'error': return 'Download Failed';
      default: return 'Download Notarized File';
    }
  };

  const getDownloadButtonIcon = () => {
    switch (downloadStatus) {
      case 'processing': return <Activity className="w-4 h-4 mr-2 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'error': return <AlertTriangle className="w-4 h-4 mr-2" />;
      default: return <Download className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Notary</h1>
            <p className="text-gray-600">
              Type your document below. Your keystrokes will be captured and notarized to prove human authorship.
            </p>
          </div>
          
          {/* Confidence Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getConfidenceColor(stats.humanConfidence)}`}>
            {getConfidenceText(stats.humanConfidence)}: {stats.humanConfidence}%
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Editor Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Editor</h2>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    isCapturing 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      isCapturing ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                    }`} />
                    {isCapturing ? `Capturing ${stats.totalKeys} events` : 'Ready to capture'}
                  </span>
                </div>
              </div>
            </div>

            {/* Text Area */}
            <div className="p-6">
              <textarea
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onPaste={handlePaste}
                onCopy={handleCopy}
                onCut={handleCut}
                placeholder="Start typing your document here... Your keystrokes, timing, and patterns will be captured to create a unique biometric signature that proves human authorship."
                className="w-full h-96 p-4 border text-black border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
              />
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200">
                <div className="text-sm text-gray-500">
                  {text.length} characters • {text.split(/\s+/).filter(word => word.length > 0).length} words
                  {stats.pasteCount > 0 && (
                    <span className="ml-2 text-amber-600">
                      • {stats.pasteCount} paste event{stats.pasteCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  disabled={text.length === 0 || isDownloading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                    downloadStatus === 'success' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : downloadStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getDownloadButtonIcon()}
                  {getDownloadButtonText()}
                </button>
              </div>

              {/* File Info */}
              {downloadStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-sm text-green-800">
                    <FileDown className="w-4 h-4 mr-2" />
                    <span>
                      <strong>Notarized file downloaded!</strong> Contains {getBiometricMetadata().events.length} biometric events and cryptographic proof.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Capture Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Tips for Strong Human Verification
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Type naturally with normal speed variations</li>
              <li>• Make occasional corrections (backspaces)</li>
              <li>• Avoid large copy-paste operations</li>
              <li>• Take brief thinking pauses between sentences</li>
              <li>• Human-like rhythm increases confidence score</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Dashboard */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Dashboard Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Live Biometric Dashboard</h2>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Keystroke Stats */}
                <div className="stat-card">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Type className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats.totalKeys}</p>
                      <p className="text-xs text-gray-500">Total Keystrokes</p>
                    </div>
                  </div>
                </div>

                {/* Speed Stats */}
                <div className="stat-card">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats.currentSpeed}</p>
                      <p className="text-xs text-gray-500">Current WPM</p>
                    </div>
                  </div>
                </div>

                {/* Backspace Stats */}
                <div className="stat-card">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <MousePointer className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats.backspaceCount}</p>
                      <p className="text-xs text-gray-500">Corrections</p>
                    </div>
                  </div>
                </div>

                {/* Duration Stats */}
                <div className="stat-card">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats.sessionDuration}s</p>
                      <p className="text-xs text-gray-500">Session Duration</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Typing Rhythm Variance</span>
                  <span className="font-medium text-gray-900">{stats.variance}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Thinking Pauses (1s)</span>
                  <span className="font-medium text-gray-900">{stats.thinkingPauses}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Paste Events</span>
                  <span className={`font-medium ${stats.pasteCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {stats.pasteCount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Last Key Timing</span>
                  <span className="font-medium text-gray-900">{stats.lastKeyTiming.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Human Confidence</span>
                  <span className={`font-medium ${getConfidenceColor(stats.humanConfidence).replace('bg-', 'text-').split(' ')[0]}`}>
                    {stats.humanConfidence}%
                  </span>
                </div>
              </div>

              {/* Real-time Rhythm Visualization */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Typing Rhythm Pattern</h4>
                <div className="flex items-end justify-between h-20 space-x-1">
                  {stats.typingRhythm.slice(-15).map((timing, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-blue-500 rounded-t transition-all duration-300"
                      style={{
                        height: `${Math.min(100, (timing / 1000) * 100)}%`,
                        opacity: 0.6 + (index / 15) * 0.4,
                        backgroundColor: timing > 1000 ? '#f59e0b' : '#3b82f6' // Amber for pauses >1s
                      }}
                      title={`${timing.toFixed(0)}ms`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Fast</span>
                  <span>Typing Rhythm</span>
                  <span>Slow</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Blue: normal typing • Amber: thinking pauses
                </p>
              </div>
            </div>
          </div>

          {/* Event Log Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900">Event Log</h3>
            </div>
            <div className="p-4 max-h-48 overflow-y-auto">
              {events.slice(-8).reverse().map((event, index) => (
                <div key={event.id} className="text-xs text-gray-600 py-1 border-b border-slate-100 last:border-b-0">
                  <span className="font-mono">
                    [{new Date(event.absoluteTime).toLocaleTimeString()}] 
                  </span>
                  <span className={`ml-2 ${
                    event.type === 'paste' ? 'text-amber-600 font-medium' : 
                    event.type === 'keydown' && event.data.key === 'Backspace' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {event.type === 'keydown' ? `Key: ${event.data.key}` :
                     event.type === 'paste' ? `Paste: ${event.data.pasteLength} chars` :
                     event.type}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No events captured yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}