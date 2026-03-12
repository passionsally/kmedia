
import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { PreviewSection } from './components/PreviewSection';
import { BlogParams, PlanningParams, NewsletterParams, EventParams, InformativeParams, CorporateParams, InterviewParams, NewsRewriterParams, GenerationState, GeneratorMode } from './types';
import { generateBlogPost, generateLecturePlan, generateNewsletter, generateEventPost, generateInformativePost, generateCorporatePost, generateInterviewPost, generateNewsPost, refineBlogPost } from './services/geminiService';
import { Layout, AlertCircle, Loader2 } from 'lucide-react';

interface CustomGenerationState extends GenerationState {
  groundingSources?: any[];
}

const App: React.FC = () => {
  const [generationState, setGenerationState] = useState<CustomGenerationState>({
    mode: 'announcement',
    isLoading: false,
    isRefining: false,
    content: null,
    error: null,
    groundingSources: undefined
  });

  const handleModeChange = (mode: GeneratorMode) => {
    setGenerationState(prev => ({ ...prev, mode, error: null, content: null, groundingSources: undefined }));
  };

  const genericGenerate = async (genFn: (p: any) => Promise<any>, params: any, mode: GeneratorMode) => {
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
