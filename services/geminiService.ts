// 프론트엔드 → 백엔드 프록시 호출 (API 키는 서버에서만 관리)
import { BlogParams, PlanningParams, NewsletterParams, EventParams, InformativeParams, CorporateParams, InterviewParams, NewsRewriterParams, ReferenceFile } from "../types";

const API_BASE = '/api';

const postJSON = async (endpoint: string, body: any) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
    throw new Error(err.error || `서버 오류 (${res.status})`);
  }
  return res.json();
};

export const fetchTrendingKeywords = async (field: string): Promise<string[]> => {
  const data = await postJSON('/trending-keywords', { field });
  return data.keywords;
};

export const fetchBestArticleUrl = async (keyword: string): Promise<{url: string, title: string}> => {
  return postJSON('/best-article', { keyword });
};

export const fetchArticleFullText = async (url: string): Promise<string> => {
  const data = await postJSON('/article-fulltext', { url });
  return data.text;
};

export const generateBlogPost = async (params: BlogParams): Promise<string> => {
  const data = await postJSON('/generate/blog', params);
  return data.text;
};

export const generateLecturePlan = async (params: PlanningParams): Promise<string> => {
  const data = await postJSON('/generate/plan', params);
  return data.text;
};

export const generateNewsletter = async (params: NewsletterParams): Promise<string> => {
  const data = await postJSON('/generate/newsletter', params);
  return data.text;
};

export const generateEventPost = async (params: EventParams): Promise<string> => {
  const data = await postJSON('/generate/event', params);
  return data.text;
};

export const generateInformativePost = async (params: InformativeParams): Promise<string> => {
  const data = await postJSON('/generate/informative', params);
  return data.text;
};

export const generateCorporatePost = async (params: CorporateParams): Promise<string> => {
  const data = await postJSON('/generate/corporate', params);
  return data.text;
};

export const generateInterviewPost = async (params: InterviewParams): Promise<string> => {
  const data = await postJSON('/generate/interview', params);
  return data.text;
};

export const generateNewsPost = async (params: NewsRewriterParams): Promise<{text: string, groundingSources?: any[]}> => {
  return postJSON('/generate/news', params);
};

export const refineBlogPost = async (original: string, instruction: string): Promise<string> => {
  const data = await postJSON('/refine', { original, instruction });
  return data.text;
};
