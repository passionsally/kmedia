
import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { PreviewSection } from './components/PreviewSection';
import { BlogParams, PlanningParams, NewsletterParams, EventParams, InformativeParams, CorporateParams, InterviewParams, NewsRewriterParams, GenerationState, GeneratorMode } from './types';
import { generateBlogPost, generateLecturePlan, generateNewsletter, generateEventPost, generateInformativePost, generateCorporatePost, generateInterviewPost, generateNewsPost, refineBlogPost, setApiKey as setServiceApiKey } from './services/geminiService';
import { Layout, AlertCircle, Key, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';

interface CustomGenerationState extends GenerationState {
  groundingSources?: any[];
}

const API_KEY_STORAGE_KEY = 'kmedia_gemini_api_key';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [generationState, setGenerationState] = useState<CustomGenerationState>({
    mode: 'announcement',
    isLoading: false,
    isRefining: false,
    content: null,
    error: null,
    groundingSources: undefined
  });

  // 앱 로드 시 localStorage에서 API 키 복원
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
      setServiceApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setServiceApiKey(trimmed);
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    setShowApiKeyModal(false);
    setApiKeyInput('');
    setShowKey(false);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setServiceApiKey('');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setShowApiKeyModal(false);
    setApiKeyInput('');
  };

  const handleModeChange = (mode: GeneratorMode) => {
    setGenerationState(prev => ({ ...prev, mode, error: null, content: null, groundingSources: undefined }));
  };

  const genericGenerate = async (genFn: (p: any) => Promise<any>, params: any, mode: GeneratorMode) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setGenerationState(prev => ({ ...prev, isLoading: true, error: null, mode, groundingSources: undefined }));
    try {
      const result = await genFn(params);
      const isNews = mode === 'news';
      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        content: isNews ? result.text : result,
        groundingSources: isNews ? result.groundingSources : undefined,
        error: null,
      }));
    } catch (error: any) {
      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '콘텐츠 생성 중 오류가 발생했습니다.',
      }));
    }
  };

  const handleRefinePost = async (instruction: string) => {
    if (!generationState.content) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setGenerationState(prev => ({ ...prev, isRefining: true, error: null }));
    try {
      const refinedText = await refineBlogPost(generationState.content, instruction);
      setGenerationState(prev => ({
        ...prev,
        isRefining: false,
        content: refinedText,
        error: null,
      }));
    } catch (error: any) {
      setGenerationState(prev => ({
        ...prev,
        isRefining: false,
        error: error.message || '글 수정 중 오류가 발생했습니다.',
      }));
    }
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 6)}${'*'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}` : '';

  // API 키 미입력 시 안내 화면
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-200 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
            <Key className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            전문 기자를 위한<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">스마트 AI 뉴스 엔진</span>
          </h1>
          
          <p className="text-slate-500 text-sm mb-8">
            서비스 이용을 위해 <strong className="text-indigo-600">Google Gemini API 키</strong>를 등록해 주세요.
          </p>

          <div className="space-y-4 text-left">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                placeholder="Gemini API 키를 입력하세요 (AIza...)"
                className="w-full px-4 py-4 pr-12 border-2 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.98]"
            >
              <Key className="w-5 h-5" /> API 키 등록하기
            </button>
          </div>

          <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>보안 안내:</strong> API 키는 브라우저의 localStorage에만 저장되며, 서버에 저장되지 않습니다. 각 요청 시에만 안전하게 전달됩니다.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>API 키 발급:</strong> <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">Google AI Studio</a>에서 무료로 발급받을 수 있습니다.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-8 opacity-60">
            KOREA MEDIA STARTUP NEWS AI AGENT
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md transition-colors 
              ${generationState.mode === 'announcement' ? 'bg-blue-600' : 
                generationState.mode === 'planning' ? 'bg-purple-600' :
                generationState.mode === 'newsletter' ? 'bg-green-600' : 
                generationState.mode === 'informative' ? 'bg-indigo-600' : 
                generationState.mode === 'corporate' ? 'bg-slate-700' : 
                generationState.mode === 'interview' ? 'bg-teal-600' :
                generationState.mode === 'event' ? 'bg-pink-600' : 'bg-gray-600'}`}>
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none tracking-tight">한국미디어창업뉴스</h1>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">
                AI NEWS WRITING AGENT
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { setApiKeyInput(apiKey); setShowApiKeyModal(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-[11px] font-bold text-green-700 transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> API 키 연결됨
          </button>
        </div>
      </header>

      {/* API 키 설정 모달 */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApiKeyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" /> API 키 설정
              </h2>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">현재 등록된 키</label>
                <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg font-mono">{maskedKey}</p>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">새 API 키</label>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                  placeholder="새 Gemini API 키 입력..."
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 bottom-3 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  저장
                </button>
                <button
                  onClick={handleClearApiKey}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 border border-red-200 transition-all"
                >
                  키 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-8 pb-12">
          <div className="w-full">
            <InputSection 
              onGeneratePost={(p) => genericGenerate(generateBlogPost, p, 'announcement')}
              onGeneratePlan={(p) => genericGenerate(generateLecturePlan, p, 'planning')}
              onGenerateNewsletter={(p) => genericGenerate(generateNewsletter, p, 'newsletter')}
              onGenerateEvent={(p) => genericGenerate(generateEventPost, p, 'event')}
              onGenerateInformative={(p) => genericGenerate(generateInformativePost, p, 'informative')}
              onGenerateCorporate={(p) => genericGenerate(generateCorporatePost, p, 'corporate')}
              onGenerateInterview={(p) => genericGenerate(generateInterviewPost, p, 'interview')}
              onGenerateNews={(p) => genericGenerate(generateNewsPost, p, 'news')}
              isLoading={generationState.isLoading}
              currentMode={generationState.mode}
              onModeChange={handleModeChange}
            />
          </div>

          <div className="w-full">
            {generationState.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl flex flex-col items-center justify-center min-h-[200px] shadow-sm">
                <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
                <p className="font-bold">시스템 오류</p>
                <p className="text-sm mt-1 text-red-600/80 text-center">{generationState.error}</p>
                <button 
                  onClick={() => { setApiKeyInput(apiKey); setShowApiKeyModal(true); }}
                  className="mt-4 text-xs font-bold text-indigo-600 underline"
                >
                  API 키 확인/변경하기
                </button>
              </div>
            ) : (
              <PreviewSection 
                content={generationState.content} 
                onRefine={handleRefinePost}
                isRefining={generationState.isRefining}
                currentMode={generationState.mode}
                groundingSources={generationState.groundingSources}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
