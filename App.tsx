
import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { PreviewSection } from './components/PreviewSection';
import { BlogParams, PlanningParams, NewsletterParams, EventParams, InformativeParams, CorporateParams, InterviewParams, NewsRewriterParams, GenerationState, GeneratorMode } from './types';
import { generateBlogPost, generateLecturePlan, generateNewsletter, generateEventPost, generateInformativePost, generateCorporatePost, generateInterviewPost, generateNewsPost, refineBlogPost } from './services/geminiService';
import { Layout, Key, ExternalLink, ShieldCheck, Sparkles, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface CustomGenerationState extends GenerationState {
  groundingSources?: any[];
}

// AuthStatus: 'loading' (초기 확인), 'unauthorized' (키 없음 - 안내화면 노출), 'authorized' (키 있음 - 메인 앱)
type AuthStatus = 'loading' | 'unauthorized' | 'authorized';

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [generationState, setGenerationState] = useState<CustomGenerationState>({
    mode: 'announcement',
    isLoading: false,
    isRefining: false,
    content: null,
    error: null,
    groundingSources: undefined
  });

  // 앱 로드 시 실행: loading 상태를 유지한 채 팝업을 먼저 띄워서
  // 풀스크린 안내 화면이 팝업을 가리는 문제를 방지
  useEffect(() => {
    const initializeAuth = async () => {
      const win = window as any;
      if (win.aistudio) {
        try {
          const hasKey = await win.aistudio.hasSelectedApiKey();
          
          if (hasKey) {
            setAuthStatus('authorized');
          } else {
            // ★ 핵심 수정: unauthorized 화면을 먼저 그리지 않고
            // loading(스피너) 상태를 유지한 채 팝업을 바로 호출
            try {
              await win.aistudio.openSelectKey();
              // 팝업에서 키 선택 완료 → 메인 앱으로 진입
              setAuthStatus('authorized');
            } catch (err) {
              console.error("자동 팝업 호출 실패:", err);
              // 팝업 실패/취소 시 그때서야 안내 화면 노출
              setAuthStatus('unauthorized');
            }
          }
        } catch (e) {
          console.error("인증 확인 오류:", e);
          setAuthStatus('unauthorized');
        }
      } else {
        setAuthStatus('authorized');
      }
    };
    initializeAuth();
  }, []);

  const handleSelectKeyManual = async () => {
    const win = window as any;
    if (win.aistudio) {
      try {
        await win.aistudio.openSelectKey();
        setAuthStatus('authorized');
      } catch (e) {
        console.error("수동 키 선택 실패:", e);
      }
    }
  };

  const checkAndRequestApiKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
        return false;
      }
      return true;
    }
    return true;
  };

  const handleApiError = async (error: any) => {
    if (error.message?.includes("Requested entity was not found.")) {
      setAuthStatus('unauthorized');
      const win = window as any;
      if (win.aistudio) await win.aistudio.openSelectKey();
    }
  };

  const handleModeChange = (mode: GeneratorMode) => {
    setGenerationState(prev => ({ ...prev, mode, error: null, content: null, groundingSources: undefined }));
  };

  const genericGenerate = async (genFn: (p: any) => Promise<any>, params: any, mode: GeneratorMode) => {
    const ready = await checkAndRequestApiKey();
    if (!ready) return;

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
      await handleApiError(error);
      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '콘텐츠 생성 중 오류가 발생했습니다.',
      }));
    }
  };

  const handleRefinePost = async (instruction: string) => {
    if (!generationState.content) return;
    const ready = await checkAndRequestApiKey();
    if (!ready) return;

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
      await handleApiError(error);
      setGenerationState(prev => ({
        ...prev,
        isRefining: false,
        error: error.message || '글 수정 중 오류가 발생했습니다.',
      }));
    }
  };

  // 1. 시스템 초기 확인 중
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-bold text-lg animate-pulse">시스템 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 2. 안내 화면 (인증 전): 이 화면이 렌더링된 후 팝업이 뜹니다.
  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        {/* 뒷배경을 살짝 흐리게 하여 팝업에 집중하도록 유도 */}
        <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-200 text-center animate-in fade-in zoom-in duration-500 filter blur-[1px] hover:blur-none transition-all">
          <div className="w-28 h-28 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3">
            <Key className="w-14 h-14 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
            전문 기자를 위한 <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">스마트 AI 뉴스 엔진</span>
          </h1>
          
          <p className="text-slate-600 text-lg mb-10 font-medium">
            잠시 후 <span className="text-indigo-600 font-bold">API 키 선택창</span>이 나타납니다.<br/>
            키를 연동하시면 바로 서비스를 시작할 수 있습니다.
          </p>
          
          <div className="bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100 text-left space-y-4">
             <div className="flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-snug">
                   <strong>보안 안내:</strong> 선택하신 API 키는 브라우저 세션 내에서만 안전하게 사용됩니다.
                </p>
             </div>
             <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-snug">
                   <strong>중요:</strong> 팝업이 뜨지 않는다면 아래 버튼을 직접 클릭해 주세요.
                </p>
             </div>
          </div>
          
          <button 
            onClick={handleSelectKeyManual}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] group"
          >
            지금 API 키 수동 등록하기
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="mt-14 pt-8 border-t border-slate-100">
            <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-60">
              KOREA MEDIA STARTUP NEWS AI AGENT
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. 메인 앱 화면: 모든 인증 절차(팝업 포함)가 완료된 후 노출
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 animate-in fade-in duration-700">
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
            onClick={handleSelectKeyManual}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 transition-all shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" /> API 키 설정
          </button>
        </div>
      </header>

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
                <button onClick={handleSelectKeyManual} className="mt-4 text-xs font-bold text-indigo-600 underline">API 키 재연동하기</button>
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
