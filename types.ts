
export type GeneratorMode = 'announcement' | 'planning' | 'newsletter' | 'event' | 'informative' | 'corporate' | 'news' | 'interview';

export type BlogStyleType = 'style_a' | 'style_b' | 'style_c' | 'style_d';

export type NewsletterStyleType = 'style_1' | 'style_2' | 'style_3' | 'style_4' | 'style_5';

export type ArticleType = 'opening' | 'conclusion';

export type LectureType = 'open' | 'regular' | 'free' | 'entertainment' | 'sports' | 'mixed';

export type BookType = 'single' | 'co-author';

export interface ReferenceFile {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded string
}

export interface InterviewData {
  name: string;
  content: string;
  affiliation?: string;
  position?: string;
}

export interface IntervieweeInfo {
  name: string;
  affiliation: string;
  dialogue?: string;
}

export interface CoAuthorData {
  nameAndBio: string;
  quote: string;
}

export interface TopicIdea {
  title: string;
  series: string[];
}

export interface BlogParams {
  lectureType: LectureType;
  regularCourseWeeks?: number;
  regularCourseSessions?: number;
  instructorName: string;
  lectureDate: string;
  lectureTopic: string;
  lectureContent: string;
  videoLinks: string;
  attachments: string;
  chatLink: string;
  googleFormLink: string;
  paymentLink?: string;
  additionalInfo?: string;
  certificates?: string;
  style: BlogStyleType;
  referenceFiles: ReferenceFile[];
  relatedLectureUrl1?: string;
  relatedLectureUrl2?: string;
  relatedLectureUrl3?: string;
  articleCategory?: string;
  targetAudience?: string;
  interviewees?: IntervieweeInfo[];
}

export interface PlanningParams {
  lectureType?: LectureType;
  referenceFiles: ReferenceFile[];
  bookType?: BookType;
  bookTitle?: string;
  genre?: string;
  publicationType?: string;
  authorBio?: string;
  bookIntro?: string;
  publisherReview?: string;
  purchaseLink?: string;
  interviews?: IntervieweeInfo[];
  targetAudience?: string;
  relatedLectureUrl1?: string;
  relatedLectureUrl2?: string;
}

export interface NewsletterParams {
  topic: string;
  category: string;
  targetAudience: string;
  videoUrls: string[];
  referenceUrls?: string[];
  mainContent?: string;
  referenceFiles?: ReferenceFile[];
  interviewees?: IntervieweeInfo[];
  // 참고 자료 필드 추가
  referenceUrl?: string;
  youtubeUrl?: string;
  sourceTitle?: string;
  sourceBody?: string;
}

export interface EventParams {
  headline: string; // 기사 헤드라인 주제
  instructor: string; // 강사명/사회자/진행자
  targetAudience: string; // 대상 (별도 입력)
  lectureTopic: string; // 강의/행사/세미나 주제
  organizer: string; // 주최 단체
  ministry: string; // 자격증 주무부처
  coOrganizer: string; // 협력 단체
  issuer: string; // 자격증 발급기관
  institution: string; // 주최 교육기관
  mainContent: string; // 강의 성과/주요내용
  interviews: InterviewData[]; // 현장 인터뷰 리스트
  referenceFiles: ReferenceFile[];
  referenceUrl?: string; // 참고 URL
  youtubeUrl?: string; // 유튜브 영상 URL
  sourceTitle?: string; // 기사 제목
  sourceBody?: string; // 기사 본문
}

export interface InformativeParams {
  topic: string;
  category: string;
  targetAudience: string;
  region: string;
  keyStats: string;
  mainContent: string;
  referenceFiles: ReferenceFile[];
  interviews?: IntervieweeInfo[];
  // 참고 자료 필드 추가
  referenceUrl?: string;
  youtubeUrl?: string;
  sourceTitle?: string;
  sourceBody?: string;
}

export interface CorporateParams {
  companyName: string;
  industry: string;
  coreProduct: string;
  philosophy: string;
  ceoMessage: string;
  purpose: string;
  targetAudience: string;
  tone: string;
  referenceFiles: ReferenceFile[];
  interviews?: IntervieweeInfo[];
  // 기업홍보 참고 자료 필드 추가
  homepageUrl?: string;
  referenceUrl?: string;
  youtubeUrl?: string;
  sourceTitle?: string;
  sourceBody?: string;
  searchKeywords?: string; // 검색노출 희망 키워드 추가
}

export interface InterviewParams {
  intervieweeName: string; // 인터뷰이 이름
  intervieweeRole: string; // 직함/소속
  headline: string; // 기사 헤드라인
  topic: string; // 인터뷰 주제
  interviewContent: string; // 주요 인터뷰 내용 (Q&A)
  referenceFiles: ReferenceFile[];
  // 추가 인터뷰이 (3명)
  interviews?: IntervieweeInfo[];
  // 참고 자료
  referenceUrl?: string;
  youtubeUrl?: string;
  sourceTitle?: string;
  sourceBody?: string;
}

export interface NewsRewriterParams {
  sourceType: string;
  newsField: string;
  articleType: string;
  mediaStyle: string;
  mainContent: string;
  referenceFiles: ReferenceFile[];
  refUrls: string[];
}

export interface GenerationState {
  mode: GeneratorMode;
  isLoading: boolean;
  isRefining: boolean;
  content: string | null;
  error: string | null;
}
