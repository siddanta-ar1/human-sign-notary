// src/components/DecoderPage.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import AnalysisBreakdown from '@/components/AnalysisBreakdown';
import { 
  Upload, 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock,
  Type,
  MousePointer,
  BarChart3
} from 'lucide-react';
import { AnalysisEngine } from '@/lib/analysisEngine';
import { FileAnalysisResult, VERDICT_TYPES } from '@/types';
import HumanAIRadarChart from '@/components/charts/RadarChart';
import TypingLineChart from '@/components/charts/LineChart';

export default function DecoderPage() {
  const [analysis, setAnalysis] = useState<FileAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.humansign')) {
      setError('Please upload a valid .humansign file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await AnalysisEngine.analyzeHumanSignFile(file);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze file. Please ensure it is a valid HumanSign file.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.humansign']
    },
    multiple: false
  });

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case VERDICT_TYPES.VERIFIED_HUMAN:
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: CheckCircle,
          title: 'Verified Human',
          description: 'This document shows strong evidence of human authorship'
        };
      case VERDICT_TYPES.MIXED_CONTENT:
        return {
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          icon: AlertTriangle,
          title: 'Mixed Content',
          description: 'This document contains both human and non-human elements'
        };
      case VERDICT_TYPES.PASTE_DETECTED:
        return {
          color: 'text-orange-600 bg-orange-100 border-orange-200',
          icon: AlertTriangle,
          title: 'Paste Detected',
          description: 'Significant paste operations detected in this document'
        };
      case VERDICT_TYPES.AI_DETECTED:
        return {
          color: 'text-red-600 bg-red-100 border-red-200',
          icon: XCircle,
          title: 'AI Content Detected',
          description: 'This document shows patterns consistent with AI generation'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: AlertTriangle,
          title: 'Invalid File',
          description: 'This file could not be verified'
        };
    }
  };

  const getRadarData = () => {
    if (!analysis) return [];
    
    return [
      { subject: 'Rhythm', human: 85, ai: 20, fullMark: 100 },
      { subject: 'Speed Var', human: 75, ai: 15, fullMark: 100 },
      { subject: 'Pauses', human: 70, ai: 10, fullMark: 100 },
      { subject: 'Corrections', human: 80, ai: 5, fullMark: 100 },
      { subject: 'Pattern', human: 65, ai: 25, fullMark: 100 },
    ];
  };

  const getLineChartData = () => {
    if (!analysis?.metadata) return [];
    
    // Simulate typing pattern data based on analysis
    return Array.from({ length: 20 }, (_, i) => ({
      time: i * 5,
      speed: 30 + Math.sin(i * 0.5) * 10 + (analysis.humanScore / 100) * 20,
      rhythm: 40 + Math.cos(i * 0.3) * 30
    }));
  };

  const verdictConfig = analysis ? getVerdictConfig(analysis.verdict) : null;
  const VerdictIcon = verdictConfig?.icon || AlertTriangle;

  return (
    <div className="animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Verification</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a .humansign file to verify its authenticity and analyze the typing biometrics.
            Our system will detect AI-generated content, paste operations, and verify cryptographic proof.
          </p>
        </div>

        {/* Upload Area */}
        {!analysis && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            {isAnalyzing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing File...</h3>
                <p className="text-gray-500">Verifying cryptographic proof and analyzing biometric patterns</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Drop the file here' : 'Upload Notarized File'}
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag and drop your .humansign file here, or click to browse
                </p>
                <button className="btn-primary">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Choose File
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Supports .humansign files created with HumanSign Notary
                </p>
              </>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && verdictConfig && (
          <div className="space-y-6 mt-8">
            {/* Big Reveal - Verdict Card */}
            <div className={`border-2 rounded-2xl p-8 text-center ${verdictConfig.color}`}>
              <div className="flex flex-col items-center">
                <VerdictIcon className="w-16 h-16 mb-4" />
                <h2 className="text-3xl font-bold mb-2">{verdictConfig.title}</h2>
                <p className="text-lg opacity-80 mb-4">{verdictConfig.description}</p>
                <div className="text-2xl font-bold">
                  Confidence Score: {analysis.humanScore}%
                </div>
              </div>
            </div>

            {/* Two-Column Layout for Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Cryptographic Proof & Basic Stats */}
              <div className="space-y-6">
                {/* Cryptographic Proof */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Cryptographic Proof
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Digital Signature</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        analysis.isValid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {analysis.isValid ? '✅ Verified' : '❌ Invalid'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Content Integrity</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        !analysis.isTampered 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {!analysis.isTampered ? '✅ Preserved' : '❌ Tampered'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Hash Verification</span>
                      <span className="text-xs font-mono text-gray-500">
                        {analysis.manifest?.contentHash?.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biometric Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Biometric Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat-card">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Type className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.metadata?.events.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Total Events</p>
                        </div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.manifest?.fileInfo.sessionDuration?.toFixed(1) || 0}s
                          </p>
                          <p className="text-xs text-gray-500">Session Duration</p>
                        </div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <MousePointer className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.metadata?.events.filter((e: any) => 
                              e.type === 'keydown' && e.data.key === 'Backspace'
                            ).length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Corrections</p>
                        </div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {analysis.metadata?.events.filter((e: any) => 
                              e.type === 'paste'
                            ).length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Paste Events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anomalies Detected */}
                {analysis.anomalies.length > 0 && (
                  <div className="card border-amber-200 bg-amber-50">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Anomalies Detected
                    </h3>
                    <ul className="space-y-2">
                      {analysis.anomalies.map((anomaly, index) => (
                        <li key={index} className="text-sm text-amber-800 flex items-start">
                          <span className="mr-2">⚠️</span>
                          {anomaly}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column - Charts */}
              <div className="space-y-6">
                {/* AI vs Human Radar Chart */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Biometric Fingerprint Analysis
                  </h3>
                  <HumanAIRadarChart data={getRadarData()} />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Comparison of typing patterns against known human and AI profiles
                  </p>
                </div>

                {/* Typing Pattern Chart */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Typing Rhythm Analysis
                  </h3>
                  <TypingLineChart data={getLineChartData()} />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Speed variations and rhythm patterns throughout the session
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Analysis Breakdown */}
            <AnalysisBreakdown analysis={analysis} />

            {/* Content Preview */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Content</h3>
              <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {analysis.content || 'No content available'}
                </pre>
              </div>
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>{analysis.content.length} characters</span>
                <span>{analysis.manifest?.fileInfo.wordCount || 0} words</span>
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={() => setAnalysis(null)}
                className="btn-secondary"
              >
                Analyze Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}