// src/app/page.tsx
'use client';

import { useState } from 'react';
import { FileText, Shield, Upload } from 'lucide-react';
import NotaryPage from '@/components/NotaryPage';
import DecoderPage from '@/components/DecoderPage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('notary');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HumanSign</h1>
                <p className="text-xs text-gray-500">Keystroke Notary</p>
              </div>
            </div>
            
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentPage('notary')}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  currentPage === 'notary'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Notary
              </button>
              <button
                onClick={() => setCurrentPage('decoder')}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  currentPage === 'decoder'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Decoder
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'notary' && <NotaryPage />}
        {currentPage === 'decoder' && <DecoderPage />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              HumanSign - Cryptographic Proof of Human Authorship • v1.0.0
            </p>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <span className="text-xs text-gray-500">Secure • Verifiable • Tamper-Proof</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}