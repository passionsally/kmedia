
import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, Send, Layout, Info, PenTool, Image as ImageIcon, Camera, Zap, UserCheck, ShieldAlert, Lightbulb, Users, Mic } from 'lucide-react';
import { GeneratorMode } from '../types';

interface CopyableSectionProps {
  title: string;
  content: string;
  className?: string;
  centerText?: boolean;
  icon?: any;
  copyLabel?: string;
}

const CopyableSection: React.FC<CopyableSectionProps> = ({ 
  title, 
  content, 
  className = "", 
  centerText = false, 
  icon: Icon,
  copyLabel = '복사'
}) => {
  const [copied, setCopied] = useState(false);
  const cleanContent = content.trim();

  const handleCopy = async () => {
    if (cleanContent) {
      try {
        await navigator.clipboard.writeText(cleanContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  if (!cleanContent) return null;

  return (
    <div className={`mb-6 group animate-in fade-in slide-in-from-top-2 duration-500 ${className}`}>
       <div className="flex justify-between items-center mb-2 bg-slate-50 p-2.5 rounded-t-xl border-b border-slate-100">
         <div className="flex items-center gap-2">
           {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
           <h3 className="font-bold text-slate-700 text-xs uppercase tracking-tight">{title}</h3>
         </div>
         <button 
           onClick={handleCopy} 
           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
             copied 
               ? 'bg-green-100 text-green-700' 
               : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
           }`}
         >
           {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
           {copied ? '복사됨' : copyLabel}
         </button>
       </div>
       <div className={`p-5 bg-white border border-t-0 border-slate-100 rounded-b-xl whitespace-pre-wrap leading-relaxed text-[15px] text-slate-800 ${centerText ? 'text-center' : 'text-left'}`}>
         {cleanContent}
       </div>
    </div>
  );
};

interface PreviewSectionProps {
  content: string | null;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
  currentMode: GeneratorMode;
  groundingSources?: any[];
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ content, onRefine, isRefining, currentMode, groundingSources }) => {
  const [refinementInput, setRefinementInput] = useState('');
  const [parsedSections, setParsedSections] = useState<{title: string, body: string, center: boolean, icon?: any, className?: string}[]>([]);

  useEffect(() => {
    if (!content) {
      setParsedSections([]);
      return;
    }

    const sections: {title: string, body: string, center: boolean, icon?: any, className?: string}[] = [];
    
    // Improved parsing logic to handle multiple potential end tags
    const getSection = (startTag: string, possibleEndTags: string[] = []) => {
      const startIndex = content.indexOf(startTag);
      if (startIndex === -1) return "";

      let nearestEndIndex = content.length;
      let foundEnd = false;

      possibleEndTags.forEach(endTag => {
        const idx = content.indexOf(endTag, startIndex + startTag.length);
        if (idx !== -1 && idx < nearestEndIndex) {
          nearestEndIndex = idx;
          foundEnd = true;
        }
      });

      const extracted = content.substring(startIndex + startTag.length, nearestEndIndex).trim();
      return extracted.replace(/^[:\s]+/, '').trim();
    };

    // Define Parse Rules
    const title = getSection('<<<NEWS_TITLE>>>', ['<<<NEWS_SUB>>>', '<<<IMAGE_CAPTION>>>']);
    if (title) sections.push({ title: "헤드라인 (제목)", body: title, center: false, icon: Layout });
    
    const sub = getSection('<<<NEWS_SUB>>>', ['<<<IMAGE_CAPTION>>>', '<<<NEWS_LEAD>>>']);
    if (sub) sections.push({ title: "부제목", body: sub, center: false, icon: Info });
    
    const caption = getSection('<<<IMAGE_CAPTION>>>', ['<<<NEWS_LEAD>>>', '<<<NEWS_BODY>>>']);
    if (caption) sections.push({ title: "이미지 캡션 설명", body: caption, center: false, icon: Camera });
    
    const lead = getSection('<<<NEWS_LEAD>>>', ['<<<NEWS_BODY>>>', '<<<INTERVIEW_SECTION>>>']);
    if (lead) sections.push({ title: "리드문", body: lead, center: false, icon: PenTool });
    
    // NEWS_BODY can end at INTERVIEW_SECTION OR ADMIN_TIP
    const body = getSection('<<<NEWS_BODY>>>', ['<<<INTERVIEW_SECTION>>>', '<<<ADMIN_TIP>>>']);
    if (body) sections.push({ title: "기사 본문", body: body, center: false, icon: FileText });

    const interview = getSection('<<<INTERVIEW_SECTION>>>', ['<<<ADMIN_TIP>>>']);
    if (interview) sections.push({ title: "생생 인터뷰", body: interview, center: false, icon: Mic, className: "border-indigo-100 bg-indigo-50/20" });

    const tip = getSection('<<<ADMIN_TIP>>>', []); // No end tag implies until end of string
    if (tip) sections.push({ title: "관리자 유의점 TIP", body: tip, center: false, icon: UserCheck, className: "border-amber-100 bg-amber-50/30" });
    
    setParsedSections(sections.length > 0 ? sections : [{ title: "본문", body: content, center: false, icon: FileText }]);
  }, [content, currentMode]);

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refinementInput.trim()) {
      onRefine(refinementInput);
      setRefinementInput('');
    }
  };

  if (!content) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> 
          {currentMode === 'news' ? '뉴스 리라이팅 결과' : '뉴스 기사 미리보기'}
        </h2>
      </div>
      <div className="p-6 bg-slate-50/50 space-y-2 max-h-[1200px] overflow-y-auto custom-scrollbar">
        
        {parsedSections.map((s: any, idx) => (
          <CopyableSection 
            key={idx} 
            title={s.title} 
            content={s.body} 
            centerText={s.center} 
            icon={s.icon} 
            className={s.className}
          />
        ))}

        <div className="border-t border-slate-200 pt-6 mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">AI 문구 수정 및 리라이팅 요청</span>
          </div>
          <form onSubmit={handleRefineSubmit} className="relative">
            <textarea 
              value={refinementInput} 
              onChange={(e) => setRefinementInput(e.target.value)} 
              placeholder="특정 단어 수정이나 문장 길이 조절 등 요청사항을 입력하세요..." 
              className="w-full pl-4 pr-14 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm bg-white shadow-inner transition-all" 
              rows={3} 
            />
            <button 
              type="submit" 
              disabled={isRefining || !refinementInput.trim()} 
              className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-md"
            >
              {isRefining ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
