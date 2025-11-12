// src/components/AnalysisBreakdown.tsx
'use client';

import { CheckCircle, XCircle, AlertTriangle, Info, Shield } from 'lucide-react';

interface AnalysisBreakdownProps {
  analysis: any;
}

export default function AnalysisBreakdown({ analysis }: AnalysisBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2 text-blue-600" />
        Detailed Analysis Breakdown
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cryptographic Security */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Cryptographic Security
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Digital Signature</span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                analysis.isValid 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysis.isValid ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {analysis.isValid ? 'Verified' : 'Invalid'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Content Integrity</span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                !analysis.isTampered 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {!analysis.isTampered ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {!analysis.isTampered ? 'Preserved' : 'Tampered'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Timestamp Validation</span>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Sequential
              </span>
            </div>
          </div>
        </div>

        {/* AI Detection Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">AI Detection Analysis</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">AI Probability</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreBg(100 - (analysis.aiAnalysis?.aiProbability || 0))} ${getScoreColor(100 - (analysis.aiAnalysis?.aiProbability || 0))}`}>
                {100 - (analysis.aiAnalysis?.aiProbability || 0)}% Human
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Rhythm Analysis</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                (analysis.aiAnalysis?.features?.consistency || 0) > 0.3 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {(analysis.aiAnalysis?.features?.consistency || 0) > 0.3 ? 'Natural' : 'Robotic'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Behavior Patterns</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                (analysis.aiAnalysis?.features?.backspaceRatio || 0) > 0.02 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {(analysis.aiAnalysis?.features?.backspaceRatio || 0) > 0.02 ? 'Human-like' : 'Few Corrections'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {analysis.anomalies.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Security Red Flags
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {analysis.anomalies.map((anomaly: string, index: number) => (
              <li key={index}>• {anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Trust Indicators</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Cryptographic Proof</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Biometric Verification</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Timestamp Chain</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Content Integrity</span>
          </div>
        </div>
      </div>
    </div>
  );
}