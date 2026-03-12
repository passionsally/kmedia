
import React, { useState, useCallback, useRef } from 'react';
import { generateVeoPackage, GenerationResult, Scene } from '../services/geminiService';
import { PROMPT_STYLES, MOODS, CAMERA_SHOTS } from '../constants';

type SelectOption = {
  readonly value: string;
  readonly label: string;
};

interface ImageData {
  data: string;
  mimeType: string;
  preview: string;
  id: string;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly SelectOption[];
  id: string;
}> = ({ label, value, onChange, options, id }) => (
  <div className="flex-1 min-w-[150px]">
    <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition cursor-pointer"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const SceneCard: React.FC<{ scene: Scene }> = ({ scene }) => {
  const [copied, setCopied] = useState(false);
  const copyPrompt = () => {
    navigator.clipboard.writeText(scene.veoPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-purple-600/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">
          SCENE {scene.sceneNumber} ({scene.duration})
        </span>
        <button 
          onClick={copyPrompt}
          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors uppercase font-bold"
        >
          {copied ? 'Copied!' : 'Copy Prompt'}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <p className="text-gray-200 text-sm mb-3 font-medium leading-relaxed">{scene.visualDescription}</p>
      <div className="bg-black/30 p-3 rounded-lg border border-gray-700/50 mb-2">
        <p className="text-xs text-purple-300 font-mono break-words">"{scene.veoPrompt}"</p>
      </div>
      {scene.directionTips && (
        <p className="text-[11px] text-gray-500 mt-2 italic">💡 {scene.directionTips}</p>
      )}
    </div>
  );
};

const PromptGenerator: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState(PROMPT_STYLES[0].value);
  const [mood, setMood] = useState(MOODS[0].value);
  const [shot, setShot] = useState(CAMERA_SHOTS[0].value);
  const [imageTips, setImageTips] = useState('');
  const [images, setImages] = useState<ImageData[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'short' | 'long'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMain, setCopiedMain] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 10;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    const newImagesPromises = filesToProcess.map((file) => {
      return new Promise<ImageData>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve({
            data: base64String,
            mimeType: file.type,
            preview: reader.result as string,
            id: Math.random().toString(36).substr(2, 9)
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(newImagesPromises);
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('영상 아이디어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const imagePayload = images.map(img => ({ data: img.data, mimeType: img.mimeType }));
      const data = await generateVeoPackage(
        idea, 
        style, 
        mood, 
        shot, 
        imagePayload.length > 0 ? imagePayload : undefined, 
        imageTips
      );
      setResult(data);
      setActiveTab('prompt');
    } catch (err) {
      setError('생성에 실패했습니다. 요청이 너무 복잡할 수 있으니 단순하게 시도해보세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [idea, style, mood, shot, images, imageTips]);

  const handleCopyMain = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.optimizedPrompt);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-gray-900/50 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label htmlFor="idea" className="block text-lg font-semibold text-gray-100">
                  영상 아이디어
                </label>
                <span className="text-xs text-purple-400 font-medium animate-pulse">Veo 3 경량 최적화 모드 활성</span>
              </div>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="단순하고 명확한 아이디어일수록 고품질 영상이 생성됩니다."
                rows={3}
                className="w-full bg-gray-800/80 border border-gray-600 rounded-xl shadow-inner p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-base"
              />
            </div>

            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-400">
                    참조 이미지 (최대 {MAX_IMAGES}장)
                  </label>
                  <span className="text-[10px] text-gray-500 bg-gray-700 px-2 py-0.5 rounded uppercase tracking-wider">{images.length} / {MAX_IMAGES}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-600 group">
                      <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-800/60 transition group"
                    >
                      <svg className="w-6 h-6 text-gray-500 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-[10px] mt-1 text-gray-500 group-hover:text-purple-400 font-medium">Add Image</span>
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" />
              </div>
              <div>
                <label htmlFor="imageTips" className="block text-sm font-medium text-gray-400 mb-2">이미지 핵심 특징 요약</label>
                <textarea
                  id="imageTips"
                  value={imageTips}
                  onChange={(e) => setImageTips(e.target.value)}
                  placeholder="이미지의 가장 중요한 요소 1~2개만 적어주세요 (예: 파란색 슈트, 숲 배경)"
                  rows={2}
                  className="w-full bg-gray-800/80 border border-gray-600 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectInput label="Style" id="style-select" value={style} onChange={(e) => setStyle(e.target.value)} options={PROMPT_STYLES} />
              <SelectInput label="Mood" id="mood-select" value={mood} onChange={(e) => setMood(e.target.value)} options={MOODS} />
              <SelectInput label="Camera" id="shot-select" value={shot} onChange={(e) => setShot(e.target.value)} options={CAMERA_SHOTS} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-xl text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Veo 최적화 가공 중...
                </div>
              ) : '🎬 고품질 비디오 시나리오 생성'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-center text-red-300 text-sm font-medium">{error}</div>}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700 shadow-lg">
            {(['prompt', 'short', 'long'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                {tab === 'prompt' ? '통합 프롬프트' : tab === 'short' ? '20초 숏폼' : '2분 롱폼 기획'}
              </button>
            ))}
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 font-bold uppercase tracking-widest">Optimized for Veo 3</span>
            </div>

            {activeTab === 'prompt' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Veo 3 마스터 프롬프트</h3>
                  <button 
                    onClick={handleCopyMain}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-purple-600 rounded-lg text-xs font-bold transition-all border border-gray-700 shadow-md active:scale-95"
                  >
                    {copiedMain ? 'Copied!' : 'Copy Master Prompt'}
                  </button>
                </div>
                <div className="bg-black/40 p-6 rounded-xl border border-gray-700 shadow-inner group relative">
                  <p className="font-mono text-gray-200 leading-relaxed text-base italic">"{result.optimizedPrompt}"</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    Success Rate Optimized (Under 80 words)
                  </div>
                </div>
                <div className="bg-purple-900/10 p-5 rounded-xl border border-purple-500/20">
                  <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z"></path></svg>
                    전략적 연출 가이드
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{result.creativeDirecting}</p>
                </div>
              </div>
            )}

            {activeTab === 'short' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-pink-300">20초 숏폼 스토리보드</h3>
                  <span className="text-[10px] text-gray-500 italic bg-gray-800 px-2 py-1 rounded">Fast Production Mode</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.shortForm.map(scene => <SceneCard key={scene.sceneNumber} scene={scene} />)}
                </div>
              </div>
            )}

            {activeTab === 'long' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-blue-300">2분 롱폼 시나리오</h3>
                  <span className="text-[10px] text-gray-500 italic bg-gray-800 px-2 py-1 rounded">Narrative Architecture</span>
                </div>
                <div className="space-y-4">
                  {result.longForm.map(scene => <SceneCard key={scene.sceneNumber} scene={scene} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
