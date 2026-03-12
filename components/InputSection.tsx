
import React, { useState, useRef } from 'react';
import { BlogParams, PlanningParams, NewsletterParams, EventParams, InformativeParams, CorporateParams, InterviewParams, NewsRewriterParams, GeneratorMode, ReferenceFile, IntervieweeInfo, InterviewData } from '../types';
import { Sparkles, User, Type, Link as LinkIcon, ClipboardList, Trash2, FileUp, Layout, Check, Zap, Search, Newspaper, Building2, Globe, FileText, TrendingUp, Target, MapPin, AlertTriangle, Scale, Loader2, BookOpen, Briefcase, Megaphone, Mic2, Book, Quote, Users, MessageSquare, ExternalLink, Youtube, Link } from 'lucide-react';
import { fetchTrendingKeywords, fetchBestArticleUrl, fetchArticleFullText } from '../services/geminiService';

interface InputSectionProps {
  onGeneratePost: (params: BlogParams) => void;
  onGeneratePlan: (params: PlanningParams) => void;
  onGenerateNewsletter: (params: NewsletterParams) => void;
  onGenerateEvent: (params: EventParams) => void;
  onGenerateInformative: (params: InformativeParams) => void;
  onGenerateCorporate: (params: CorporateParams) => void;
  onGenerateInterview: (params: InterviewParams) => void;
  onGenerateNews: (params: NewsRewriterParams) => void;
  isLoading: boolean;
  currentMode: GeneratorMode;
  onModeChange: (mode: GeneratorMode) => void;
}

const InputField = ({ label, icon: Icon, value, onChange, placeholder, required = false }: any) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
        {Icon && <Icon className="w-3 h-3 text-slate-400" />} {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30" placeholder={placeholder} required={required} />
  </div>
);

const SelectField = ({ label, icon: Icon, value, onChange, options, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
      {Icon && <Icon className="w-3 h-3 text-slate-400" />} {label}
    </label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30">
      <option value="">{placeholder || '선택안함'}</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const FileSection = ({ files, onRemove, onUploadClick, title }: any) => (
  <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
    <div className="flex justify-between items-center px-1">
      <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
        <FileUp className="w-3 h-3 text-slate-400" /> {title} (최대 10개)
      </label>
      <span className="text-[10px] text-slate-400 font-medium">{files?.length || 0}/10</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {files?.map((f: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg text-[10px] border border-slate-200">
          <span className="max-w-[120px] truncate">{f.name}</span>
          <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
        </div>
      ))}
      <button type="button" onClick={onUploadClick} className="px-3 py-1.5 border-2 border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center gap-1">
        <FileUp className="w-3 h-3" /> 파일 추가
      </button>
    </div>
  </div>
);

export const InputSection: React.FC<InputSectionProps> = ({ 
  onGeneratePost, onGeneratePlan, onGenerateNewsletter, onGenerateEvent, onGenerateInformative, onGenerateCorporate, onGenerateInterview, onGenerateNews, isLoading, currentMode, onModeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [isUrlLoading, setIsUrlLoading] = useState<string | null>(null);
  const [recommendedArticle, setRecommendedArticle] = useState<{url: string, title: string} | null>(null);

  // Constants for Event Mode Options
  const MINISTRY_LIST = ['선택안함','교육부','문화체육관광부','산업통상자원부','과학기술정보통신부','중소벤처기업부','국토교통부','고용노동부'];
  
  const CO_ORGANIZER_LIST = [
    '선택안함',
    '한국SNS인재개발원',
    '한국AI마케팅진흥원',
    '한국AI광고영상진흥원',
    '한국강사역량개발원',
    '한국미디어창업진흥원',
    '한국웹소설웹툰콘텐츠진흥원',
    '한국자서전출판진흥원',
    '서울국제광고영화협회',
    '재노북스',
    '한국ESG생산성진흥원',
    '국제캔바디자인진흥원'
  ];

  const INSTITUTION_LIST = ['재노스쿨 평생교육원', '미디어창업아카데미 평생교육원'];
  const ISSUER_LIST = ['선택안함', '한국미디어창업진흥원', '한국SNS인재개발원'];

  const getSelectValue = (val: string, options: string[]) => {
    if (options.includes(val)) return val;
    return '기타';
  };

  // --- 상태 관리 ---
  const [postData, setPostData] = useState<BlogParams>({
    lectureType: 'sports', instructorName: '', lectureDate: '', lectureTopic: '', lectureContent: '', videoLinks: '', attachments: '', chatLink: '', googleFormLink: '', style: 'style_a', referenceFiles: [], articleCategory: '스포츠', targetAudience: '일반 대중', relatedLectureUrl1: '', relatedLectureUrl2: ''
  });
  
  const [planData, setPlanData] = useState<PlanningParams>({
    bookType: 'single', bookTitle: '', genre: '경제경영', publicationType: '서점유통종이책', authorBio: '', bookIntro: '', publisherReview: '', purchaseLink: '', 
    interviews: [
      { name: '', affiliation: '작가 소속', dialogue: '' },
      { name: '', affiliation: '독자 소속', dialogue: '' },
      { name: '', affiliation: '외부전문가 소속', dialogue: '' }
    ], 
    referenceFiles: []
  });

  const updatePlanInterview = (idx: number, field: keyof IntervieweeInfo, value: string) => {
    setPlanData(prev => {
      const newInterviews = [...(prev.interviews || [])];
      newInterviews[idx] = { ...newInterviews[idx], [field]: value };
      return { ...prev, interviews: newInterviews };
    });
  };

  const [newsletterData, setNewsletterData] = useState<NewsletterParams>({
    topic: '', category: '보험/재테크', targetAudience: '3040 재테크관심층', videoUrls: [], mainContent: '', referenceFiles: [],
    referenceUrl: '', youtubeUrl: '', sourceTitle: '', sourceBody: ''
  });

  // 강의행사홍보 (EventParams) 초기 상태
  const [eventData, setEventData] = useState<EventParams>({
    headline: '',
    instructor: '',
    targetAudience: '',
    lectureTopic: '',
    organizer: '', 
    ministry: '선택안함',
    coOrganizer: '선택안함',
    issuer: '한국미디어창업진흥원',
    institution: '재노스쿨 평생교육원',
    mainContent: '',
    interviews: [
      { name: '수강생 A', affiliation: '', position: '수강생', content: '' },
      { name: '수강생 B', affiliation: '', position: '수강생', content: '' },
      { name: '강사/관계자', affiliation: '', position: '', content: '' },
      { name: '외부 관계자', affiliation: '', position: '', content: '' },
    ],
    referenceFiles: [],
    referenceUrl: '',
    youtubeUrl: '',
    sourceTitle: '',
    sourceBody: ''
  });

  const updateEventInterview = (idx: number, field: keyof InterviewData, value: string) => {
    setEventData(prev => {
      const newInterviews = [...prev.interviews];
      newInterviews[idx] = { ...newInterviews[idx], [field]: value };
      return { ...prev, interviews: newInterviews };
    });
  };

  const [infoData, setInfoData] = useState<InformativeParams>({ 
    topic: '', category: '시장 동향', targetAudience: '실수요자', region: '', keyStats: '', mainContent: '', referenceFiles: [],
    referenceUrl: '', youtubeUrl: '', sourceTitle: '', sourceBody: '',
    interviews: [
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' }
    ]
  });

  const updateInfoInterview = (idx: number, field: keyof IntervieweeInfo, value: string) => {
    setInfoData(prev => {
      const newInterviews = [...(prev.interviews || [])];
      newInterviews[idx] = { ...newInterviews[idx], [field]: value };
      return { ...prev, interviews: newInterviews };
    });
  };
  
  const [corporateData, setCorporateData] = useState<CorporateParams>({
    companyName: '', industry: 'IT/기술', coreProduct: '', philosophy: '', ceoMessage: '', purpose: '기업 이미지 제고', targetAudience: '잠재 고객', tone: '신뢰감 있는', referenceFiles: [],
    homepageUrl: '', referenceUrl: '', youtubeUrl: '', sourceTitle: '', sourceBody: '', searchKeywords: '',
    interviews: [
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' }
    ]
  });

  const updateCorporateInterview = (idx: number, field: keyof IntervieweeInfo, value: string) => {
    setCorporateData(prev => {
      const newInterviews = [...(prev.interviews || [])];
      newInterviews[idx] = { ...newInterviews[idx], [field]: value };
      return { ...prev, interviews: newInterviews };
    });
  };

  const [interviewData, setInterviewData] = useState<InterviewParams>({
    intervieweeName: '', intervieweeRole: '', headline: '', topic: '', interviewContent: '', referenceFiles: [],
    referenceUrl: '', youtubeUrl: '', sourceTitle: '', sourceBody: '',
    interviews: [
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' },
      { name: '', affiliation: '', dialogue: '' }
    ]
  });

  const updateInterviewMember = (idx: number, field: keyof IntervieweeInfo, value: string) => {
    setInterviewData(prev => {
      const newInterviews = [...(prev.interviews || [])];
      newInterviews[idx] = { ...newInterviews[idx], [field]: value };
      return { ...prev, interviews: newInterviews };
    });
  };

  const [newsData, setNewsData] = useState<NewsRewriterParams>({
    sourceType: '보도자료', newsField: '경제금융', articleType: '일반기사', mediaStyle: '종합지', mainContent: '', referenceFiles: [], refUrls: ['', '', '']
  });

  const handleFetchTrends = async () => {
    if (!newsData.newsField) return alert("분야를 먼저 선택해주세요.");
    setIsTrendingLoading(true);
    setRecommendedArticle(null);
    try {
      const kws = await fetchTrendingKeywords(newsData.newsField);
      setTrendingKeywords(kws);
    } catch (e) { console.error(e); } finally { setIsTrendingLoading(false); }
  };

  const handleKeywordClick = async (kw: string) => {
    setIsUrlLoading(kw);
    setRecommendedArticle(null);
    try {
      const res = await fetchBestArticleUrl(kw);
      if (res.url) {
        setRecommendedArticle(res);
        setNewsData(prev => {
          const newUrls = [...prev.refUrls];
          const emptyIdx = newUrls.findIndex(u => !u.trim());
          newUrls[emptyIdx === -1 ? 0 : emptyIdx] = res.url;
          return { ...prev, refUrls: newUrls };
        });
        const fullContent = await fetchArticleFullText(res.url);
        if (fullContent) {
          setNewsData(prev => ({
            ...prev,
            mainContent: fullContent
          }));
        }
      }
    } catch (e) { 
      console.error(e); 
      alert("기사 내용을 수집하는 중 오류가 발생했습니다.");
    } finally { 
      setIsUrlLoading(null); 
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const processed: ReferenceFile[] = [];
      for (const f of files) {
        const base64 = await new Promise<string>(r => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => r((reader.result as string).split(',')[1]);
        });
        processed.push({ name: f.name, mimeType: f.type, data: base64 });
      }
      setter((prev: any) => ({ ...prev, referenceFiles: [...(prev.referenceFiles || []), ...processed] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMode === 'announcement') onGeneratePost(postData);
    else if (currentMode === 'planning') onGeneratePlan(planData);
    else if (currentMode === 'newsletter') onGenerateNewsletter(newsletterData);
    else if (currentMode === 'event') onGenerateEvent(eventData);
    else if (currentMode === 'informative') onGenerateInformative(infoData);
    else if (currentMode === 'corporate') onGenerateCorporate(corporateData);
    else if (currentMode === 'interview') onGenerateInterview(interviewData);
    else if (currentMode === 'news') onGenerateNews(newsData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 scrollbar-hide">
        {[
          { id: 'announcement', label: '스포츠연예' },
          { id: 'planning', label: '신간도서' },
          { id: 'newsletter', label: '보험금융' },
          { id: 'event', label: '강의행사세미나' },
          { id: 'informative', label: '부동산' },
          { id: 'corporate', label: '기업홍보' },
          { id: 'interview', label: '인물인터뷰' }
        ].map(m => (
          <button key={m.id} onClick={() => onModeChange(m.id as GeneratorMode)} className={`flex-1 min-w-[100px] py-4 px-2 text-[12px] font-bold transition-all ${currentMode === m.id ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}>
            {m.label}
          </button>
        ))}
      </div>

      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={e => {
        const setters: any = { announcement: setPostData, planning: setPlanData, newsletter: setNewsletterData, event: setEventData, informative: setInfoData, corporate: setCorporateData, interview: setInterviewData, news: setNewsData };
        handleFileChange(e, setters[currentMode]);
      }} />

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
        
        {currentMode === 'announcement' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="기사 카테고리" icon={Layout} value={postData.lectureType} onChange={(v:any)=>setPostData(p=>({...p,lectureType:v}))} options={['스포츠','연예','인터뷰/르포']} />
              <SelectField label="대상 독자층" icon={Target} value={postData.targetAudience} onChange={(v:any)=>setPostData(p=>({...p,targetAudience:v}))} options={['일반 대중','팬덤/매니아','업계 관계자','MZ세대']} />
            </div>
            <InputField label="기사 제목 (헤드라인)" icon={Type} value={postData.lectureTopic} onChange={(v:any)=>setPostData(p=>({...p,lectureTopic:v}))} placeholder="독자의 호기심을 자극하는 임팩트 있는 제목" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="참조 URL 1" icon={LinkIcon} value={postData.relatedLectureUrl1} onChange={(v:any)=>setPostData(p=>({...p,relatedLectureUrl1:v}))} placeholder="https://..." />
              <InputField label="참조 URL 2" icon={LinkIcon} value={postData.relatedLectureUrl2} onChange={(v:any)=>setPostData(p=>({...p,relatedLectureUrl2:v}))} placeholder="https://..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1"><Mic2 className="w-3 h-3 text-indigo-500" /> 취재 팩트 및 주요 내용</label>
              <textarea value={postData.lectureContent} onChange={e=>setPostData(p=>({...p,lectureContent:e.target.value}))} rows={10} className="w-full p-4 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20" placeholder="기사로 구성할 주요 사건, 발언, 팩트를 자유롭게 입력하세요..." />
            </div>
            <FileSection files={postData.referenceFiles} onRemove={(i:any)=>setPostData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="보도 사진 및 문서" />
          </div>
        )}

        {currentMode === 'planning' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label="저자 유형" icon={User} value={planData.bookType} onChange={(v:any)=>setPlanData(p=>({...p,bookType:v}))} options={['single','co-author']} placeholder="선택 (1인/공동)" />
              <SelectField label="도서 장르" icon={Layout} value={planData.genre} onChange={(v:any)=>setPlanData(p=>({...p,genre:v}))} options={['경제경영','자기계발','인문/사회','에세이','IT/기술','웹소설','웹툰','동화/그림책']} />
              <SelectField label="출판 유형" icon={Book} value={planData.publicationType} onChange={(v:any)=>setPlanData(p=>({...p,publicationType:v}))} options={['서점유통종이책','pod','전자책','오디오북','회차당 연재']} />
            </div>
            
            <InputField label="도서명" icon={BookOpen} value={planData.bookTitle} onChange={(v:any)=>setPlanData(p=>({...p,bookTitle:v}))} />
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1"><User className="w-3 h-3 text-indigo-500" /> 작가소개</label>
              <textarea value={planData.authorBio} onChange={e=>setPlanData(p=>({...p,authorBio:e.target.value}))} rows={2} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20" placeholder="작가의 이력, 대표작 등..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1"><FileText className="w-3 h-3 text-indigo-500" /> 책소개글</label>
              <textarea value={planData.bookIntro} onChange={e=>setPlanData(p=>({...p,bookIntro:e.target.value}))} rows={4} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20" placeholder="전체적인 줄거리, 가치 분석..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1"><Quote className="w-3 h-3 text-indigo-500" /> 출판사서평</label>
              <textarea value={planData.publisherReview} onChange={e=>setPlanData(p=>({...p,publisherReview:e.target.value}))} rows={4} className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20" placeholder="출판사 제공 추천사 등..." />
            </div>

            <InputField label="유통사 구매링크" icon={LinkIcon} value={planData.purchaseLink} onChange={(v:any)=>setPlanData(p=>({...p,purchaseLink:v}))} placeholder="판매 URL 입력" />

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4" /> 인터뷰이 설정 (성함 / 소속 / 대사)
              </div>
              <div className="space-y-3">
                {planData.interviews?.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <InputField value={it.name} onChange={(v:string)=>updatePlanInterview(idx, 'name', v)} placeholder="성함" icon={User} />
                    </div>
                    <div className="col-span-3">
                      <InputField value={it.affiliation} onChange={(v:string)=>updatePlanInterview(idx, 'affiliation', v)} placeholder="소속" icon={Briefcase} />
                    </div>
                    <div className="col-span-7">
                      <InputField value={it.dialogue} onChange={(v:string)=>updatePlanInterview(idx, 'dialogue', v)} placeholder="생생한 인터뷰 대사 (직접 입력 가능, 비워두면 AI 자동 완성)" icon={MessageSquare} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FileSection files={planData.referenceFiles} onRemove={(i:any)=>setPlanData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="도서 관련 자료 및 초안" />
          </div>
        )}

        {currentMode === 'newsletter' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="금융 분야" icon={Layout} value={newsletterData.category} onChange={(v:any)=>setNewsletterData(p=>({...p,category:v}))} options={['보험/재테크','대출/금리','세무/회계','금융정책']} />
              <SelectField label="대상 독자" icon={Target} value={newsletterData.targetAudience} onChange={(v:any)=>setNewsletterData(p=>({...p,targetAudience:v}))} options={['2030 사회초년생','3040 재테크관심층','5060 은퇴준비층','일반 소비자']} />
            </div>
            <InputField label="기사 주제" icon={Type} value={newsletterData.topic} onChange={(v:any)=>setNewsletterData(p=>({...p,topic:v}))} />
            <textarea value={newsletterData.mainContent} onChange={e=>setNewsletterData(p=>({...p,mainContent:e.target.value}))} rows={8} className="w-full p-4 border border-slate-200 rounded-xl text-sm" />
            
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
               <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> 참고 자료 (선택사항)
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="참고 기사 URL" icon={LinkIcon} value={newsletterData.referenceUrl} onChange={(v:any)=>setNewsletterData(p=>({...p,referenceUrl:v}))} placeholder="https://..." />
                  <InputField label="유튜브 영상 URL" icon={Youtube} value={newsletterData.youtubeUrl} onChange={(v:any)=>setNewsletterData(p=>({...p,youtubeUrl:v}))} placeholder="https://youtube.com/..." />
               </div>
               <InputField label="참고 기사 제목" icon={Type} value={newsletterData.sourceTitle} onChange={(v:any)=>setNewsletterData(p=>({...p,sourceTitle:v}))} placeholder="참고할 기사의 제목을 입력하세요" />
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <FileText className="w-3 h-3 text-slate-400" /> 참고 기사 본문
                  </label>
                  <textarea value={newsletterData.sourceBody} onChange={e=>setNewsletterData(p=>({...p,sourceBody:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white" placeholder="참고할 기사 본문 내용을 복사해서 붙여넣으세요..." />
               </div>
            </div>

            <FileSection files={newsletterData.referenceFiles} onRemove={(i:any)=>setNewsletterData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="관련 이미지 및 자료" />
          </div>
        )}

        {currentMode === 'event' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputField label="기사 헤드라인 주제" icon={Newspaper} value={eventData.headline} onChange={(v:any)=>setEventData(p=>({...p,headline:v}))} required />
               <InputField label="강사명/사회자/진행자" icon={User} value={eventData.instructor} onChange={(v:any)=>setEventData(p=>({...p,instructor:v}))} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputField label="강의/행사/세미나 주제" icon={Type} value={eventData.lectureTopic} onChange={(v:any)=>setEventData(p=>({...p,lectureTopic:v}))} required />
               <InputField label="대상" icon={Target} value={eventData.targetAudience} onChange={(v:any)=>setEventData(p=>({...p,targetAudience:v}))} placeholder="예: 대학생, 직장인, 일반인" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputField label="주최 단체" icon={Building2} value={eventData.organizer} onChange={(v:any)=>setEventData(p=>({...p,organizer:v}))} placeholder="주최 단체를 입력하세요" required />
               
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <Building2 className="w-3 h-3 text-slate-400" /> 주최 교육기관
                  </label>
                  <select 
                     value={getSelectValue(eventData.institution, INSTITUTION_LIST)} 
                     onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') setEventData(p => ({...p, institution: ''}));
                        else setEventData(p => ({...p, institution: val}));
                     }} 
                     className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30"
                  >
                     {INSTITUTION_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     <option value="기타">기타 (직접입력)</option>
                  </select>
                  {getSelectValue(eventData.institution, INSTITUTION_LIST) === '기타' && (
                     <input 
                        type="text" 
                        value={eventData.institution} 
                        onChange={e => setEventData(p => ({...p, institution: e.target.value}))} 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mt-1" 
                        placeholder="주최 교육기관 직접 입력"
                     />
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <Briefcase className="w-3 h-3 text-slate-400" /> 자격증 주무부처
                  </label>
                  <select 
                     value={getSelectValue(eventData.ministry, MINISTRY_LIST)} 
                     onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') setEventData(p => ({...p, ministry: ''}));
                        else setEventData(p => ({...p, ministry: val}));
                     }} 
                     className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30"
                  >
                     {MINISTRY_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     <option value="기타">기타 (직접입력)</option>
                  </select>
                  {getSelectValue(eventData.ministry, MINISTRY_LIST) === '기타' && (
                     <input 
                        type="text" 
                        value={eventData.ministry} 
                        onChange={e => setEventData(p => ({...p, ministry: e.target.value}))} 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mt-1" 
                        placeholder="주무부처 직접 입력"
                     />
                  )}
               </div>

               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <Users className="w-3 h-3 text-slate-400" /> 협력 단체
                  </label>
                  <select 
                     value={getSelectValue(eventData.coOrganizer, CO_ORGANIZER_LIST)} 
                     onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') setEventData(p => ({...p, coOrganizer: ''}));
                        else setEventData(p => ({...p, coOrganizer: val}));
                     }} 
                     className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30"
                  >
                     {CO_ORGANIZER_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     <option value="기타">기타 (직접입력)</option>
                  </select>
                  {getSelectValue(eventData.coOrganizer, CO_ORGANIZER_LIST) === '기타' && (
                     <input 
                        type="text" 
                        value={eventData.coOrganizer} 
                        onChange={e => setEventData(p => ({...p, coOrganizer: e.target.value}))} 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mt-1" 
                        placeholder="협력 단체 직접 입력"
                     />
                  )}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <Check className="w-3 h-3 text-slate-400" /> 자격증 발급기관
                  </label>
                  <select 
                     value={getSelectValue(eventData.issuer, ISSUER_LIST)} 
                     onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') setEventData(p => ({...p, issuer: ''}));
                        else setEventData(p => ({...p, issuer: val}));
                     }} 
                     className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30"
                  >
                     {ISSUER_LIST.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     <option value="기타">기타 (직접입력)</option>
                  </select>
                  {getSelectValue(eventData.issuer, ISSUER_LIST) === '기타' && (
                     <input 
                        type="text" 
                        value={eventData.issuer} 
                        onChange={e => setEventData(p => ({...p, issuer: e.target.value}))} 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mt-1" 
                        placeholder="자격증 발급기관 직접 입력"
                     />
                  )}
               </div>
            </div>

            <div className="space-y-1.5">
               <textarea value={eventData.mainContent} onChange={e=>setEventData(p=>({...p,mainContent:e.target.value}))} rows={6} className="w-full p-4 border border-slate-200 rounded-xl text-sm" placeholder="강의의 성과나 주요 내용을 입력하세요" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Mic2 className="w-4 h-4" /> 현장 인터뷰 리스트
              </div>
              <div className="space-y-4">
                {eventData.interviews.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <InputField placeholder="이름" value={item.name} onChange={(v:string)=>updateEventInterview(idx, 'name', v)} />
                      <InputField placeholder="소속 (예: OO컴퍼니)" value={item.affiliation} onChange={(v:string)=>updateEventInterview(idx, 'affiliation', v)} />
                      <InputField placeholder="직책 (예: 팀장)" value={item.position} onChange={(v:string)=>updateEventInterview(idx, 'position', v)} />
                    </div>
                    <InputField placeholder="인터뷰 내용 (한 마디)" value={item.content} onChange={(v:string)=>updateEventInterview(idx, 'content', v)} icon={MessageSquare} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
               <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> 참고 자료 (선택사항)
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="참고 기사 URL" icon={LinkIcon} value={eventData.referenceUrl} onChange={(v:any)=>setEventData(p=>({...p,referenceUrl:v}))} placeholder="https://..." />
                  <InputField label="유튜브 영상 URL" icon={Youtube} value={eventData.youtubeUrl} onChange={(v:any)=>setEventData(p=>({...p,youtubeUrl:v}))} placeholder="https://youtube.com/..." />
               </div>
               <InputField label="참고 기사 제목" icon={Type} value={eventData.sourceTitle} onChange={(v:any)=>setEventData(p=>({...p,sourceTitle:v}))} placeholder="참고할 기사의 제목을 입력하세요" />
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <FileText className="w-3 h-3 text-slate-400" /> 참고 기사 본문
                  </label>
                  <textarea value={eventData.sourceBody} onChange={e=>setEventData(p=>({...p,sourceBody:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white" placeholder="참고할 기사 본문 내용을 복사해서 붙여넣으세요..." />
               </div>
            </div>

            <FileSection files={eventData.referenceFiles} onRemove={(i:any)=>setEventData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="관련 이미지 및 자료" />
          </div>
        )}

        {currentMode === 'informative' && (
          <div className="space-y-4 animate-in fade-in">
            <InputField label="분석 지역" icon={MapPin} value={infoData.region} onChange={(v:any)=>setInfoData(p=>({...p,region:v}))} />
            <InputField label="기사 주제" icon={Type} value={infoData.topic} onChange={(v:any)=>setInfoData(p=>({...p,topic:v}))} />
            <textarea value={infoData.mainContent} onChange={e=>setInfoData(p=>({...p,mainContent:e.target.value}))} rows={8} className="w-full p-4 border border-slate-200 rounded-xl text-sm" placeholder="시세 변동, 개발 호재 등 분석 내용..." />
            
             <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4" /> 인터뷰이 설정 (성함 / 소속 / 대사)
              </div>
              <div className="space-y-3">
                {infoData.interviews?.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <InputField value={it.name} onChange={(v:string)=>updateInfoInterview(idx, 'name', v)} placeholder="이름" icon={User} />
                    </div>
                    <div className="col-span-3">
                      <InputField value={it.affiliation} onChange={(v:string)=>updateInfoInterview(idx, 'affiliation', v)} placeholder="소속/직책" icon={Briefcase} />
                    </div>
                    <div className="col-span-7">
                      <InputField value={it.dialogue} onChange={(v:string)=>updateInfoInterview(idx, 'dialogue', v)} placeholder="대사 (비워두면 AI 자동 생성)" icon={MessageSquare} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
               <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> 참고 자료 (선택사항)
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="참고 기사 URL" icon={LinkIcon} value={infoData.referenceUrl} onChange={(v:any)=>setInfoData(p=>({...p,referenceUrl:v}))} placeholder="https://..." />
                  <InputField label="유튜브 영상 URL" icon={Youtube} value={infoData.youtubeUrl} onChange={(v:any)=>setInfoData(p=>({...p,youtubeUrl:v}))} placeholder="https://youtube.com/..." />
               </div>
               <InputField label="참고 기사 제목" icon={Type} value={infoData.sourceTitle} onChange={(v:any)=>setInfoData(p=>({...p,sourceTitle:v}))} placeholder="참고할 기사의 제목을 입력하세요" />
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <FileText className="w-3 h-3 text-slate-400" /> 참고 기사 본문
                  </label>
                  <textarea value={infoData.sourceBody} onChange={e=>setInfoData(p=>({...p,sourceBody:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white" placeholder="참고할 기사 본문 내용을 복사해서 붙여넣으세요..." />
               </div>
            </div>
            
            <FileSection files={infoData.referenceFiles} onRemove={(i:any)=>setInfoData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="관련 이미지 및 자료" />
          </div>
        )}

        {currentMode === 'corporate' && (
          <div className="space-y-4 animate-in fade-in">
            <InputField label="기업명" icon={Building2} value={corporateData.companyName} onChange={(v:any)=>setCorporateData(p=>({...p,companyName:v}))} />
            <InputField label="검색노출 희망 키워드" icon={Search} value={corporateData.searchKeywords} onChange={(v:any)=>setCorporateData(p=>({...p,searchKeywords:v}))} placeholder="예: AI솔루션, 스마트팩토리, 마케팅대행" />
            <textarea value={corporateData.philosophy} onChange={e=>setCorporateData(p=>({...p,philosophy:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm" placeholder="기업 철학 및 핵심 가치..." />
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4" /> 인터뷰이 설정 (성함 / 소속 / 대사)
              </div>
              <div className="space-y-3">
                {corporateData.interviews?.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <InputField value={it.name} onChange={(v:string)=>updateCorporateInterview(idx, 'name', v)} placeholder="이름" icon={User} />
                    </div>
                    <div className="col-span-3">
                      <InputField value={it.affiliation} onChange={(v:string)=>updateCorporateInterview(idx, 'affiliation', v)} placeholder="소속/직책" icon={Briefcase} />
                    </div>
                    <div className="col-span-7">
                      <InputField value={it.dialogue} onChange={(v:string)=>updateCorporateInterview(idx, 'dialogue', v)} placeholder="대사 (비워두면 AI 자동 생성)" icon={MessageSquare} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
               <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> 참고 자료 (선택사항)
               </div>
               <InputField label="홈페이지 URL" icon={Globe} value={corporateData.homepageUrl} onChange={(v:any)=>setCorporateData(p=>({...p,homepageUrl:v}))} placeholder="https://..." />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="참고 기사 URL" icon={LinkIcon} value={corporateData.referenceUrl} onChange={(v:any)=>setCorporateData(p=>({...p,referenceUrl:v}))} placeholder="https://..." />
                  <InputField label="유튜브 영상 URL" icon={Youtube} value={corporateData.youtubeUrl} onChange={(v:any)=>setCorporateData(p=>({...p,youtubeUrl:v}))} placeholder="https://youtube.com/..." />
               </div>
               <InputField label="참고 기사 제목" icon={Type} value={corporateData.sourceTitle} onChange={(v:any)=>setCorporateData(p=>({...p,sourceTitle:v}))} placeholder="참고할 기사의 제목을 입력하세요" />
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <FileText className="w-3 h-3 text-slate-400" /> 참고 기사 본문
                  </label>
                  <textarea value={corporateData.sourceBody} onChange={e=>setCorporateData(p=>({...p,sourceBody:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white" placeholder="참고할 기사 본문 내용을 복사해서 붙여넣으세요..." />
               </div>
            </div>

            <FileSection files={corporateData.referenceFiles} onRemove={(i:any)=>setCorporateData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="관련 이미지 및 자료" />
          </div>
        )}

        {currentMode === 'interview' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="인터뷰이 성명" icon={User} value={interviewData.intervieweeName} onChange={(v:any)=>setInterviewData(p=>({...p,intervieweeName:v}))} />
              <InputField label="소속/직함" icon={Briefcase} value={interviewData.intervieweeRole} onChange={(v:any)=>setInterviewData(p=>({...p,intervieweeRole:v}))} />
            </div>
            <InputField label="기사 헤드라인" icon={Newspaper} value={interviewData.headline} onChange={(v:any)=>setInterviewData(p=>({...p,headline:v}))} />
            <InputField label="인터뷰 주제" icon={Type} value={interviewData.topic} onChange={(v:any)=>setInterviewData(p=>({...p,topic:v}))} />
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1"><MessageSquare className="w-3 h-3 text-indigo-500" /> 주요 인터뷰 내용 (Q&A)</label>
              <textarea value={interviewData.interviewContent} onChange={e=>setInterviewData(p=>({...p,interviewContent:e.target.value}))} rows={10} className="w-full p-4 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20" placeholder="질문과 답변 내용을 자유롭게 작성하세요..." />
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4" /> 추가 인터뷰이 설정 (선택사항)
              </div>
              <div className="space-y-3">
                {interviewData.interviews?.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <InputField value={it.name} onChange={(v:string)=>updateInterviewMember(idx, 'name', v)} placeholder="이름" icon={User} />
                    </div>
                    <div className="col-span-3">
                      <InputField value={it.affiliation} onChange={(v:string)=>updateInterviewMember(idx, 'affiliation', v)} placeholder="소속/직책" icon={Briefcase} />
                    </div>
                    <div className="col-span-7">
                      <InputField value={it.dialogue} onChange={(v:string)=>updateInterviewMember(idx, 'dialogue', v)} placeholder="대사 (비워두면 AI 자동 생성)" icon={MessageSquare} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
               <div className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> 참고 자료 (선택사항)
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="참고 기사 URL" icon={LinkIcon} value={interviewData.referenceUrl} onChange={(v:any)=>setInterviewData(p=>({...p,referenceUrl:v}))} placeholder="https://..." />
                  <InputField label="유튜브 영상 URL" icon={Youtube} value={interviewData.youtubeUrl} onChange={(v:any)=>setInterviewData(p=>({...p,youtubeUrl:v}))} placeholder="https://youtube.com/..." />
               </div>
               <InputField label="참고 기사 제목" icon={Type} value={interviewData.sourceTitle} onChange={(v:any)=>setInterviewData(p=>({...p,sourceTitle:v}))} placeholder="참고할 기사의 제목을 입력하세요" />
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                     <FileText className="w-3 h-3 text-slate-400" /> 참고 기사 본문
                  </label>
                  <textarea value={interviewData.sourceBody} onChange={e=>setInterviewData(p=>({...p,sourceBody:e.target.value}))} rows={4} className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-white" placeholder="참고할 기사 본문 내용을 복사해서 붙여넣으세요..." />
               </div>
            </div>

            <FileSection files={interviewData.referenceFiles} onRemove={(i:any)=>setInterviewData(p=>({...p,referenceFiles:p.referenceFiles.filter((_:any,idx:number)=>idx!==i)}))} onUploadClick={()=>fileInputRef.current?.click()} title="관련 이미지 및 자료" />
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all active:scale-[0.98]">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" />콘텐츠 생성하기</>}
        </button>
      </form>
    </div>
  );
};
