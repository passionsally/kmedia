# 한국미디어창업뉴스 - AI 뉴스 기자 작성봇

## Project Overview
- **Name**: kmedia-news
- **Goal**: 한국미디어창업뉴스 기자를 위한 AI 기반 뉴스 기사 자동 생성 도구
- **AI Engine**: Google Gemini API (서버사이드 프록시를 통해 안전하게 호출)

## URLs
- **Production**: https://kmedia-news.pages.dev
- **GitHub**: https://github.com/passionsally/kmedia

## Architecture
```
브라우저 (React SPA)
  ↓ fetch('/api/generate/blog', {...})
Cloudflare Pages Worker (Hono)
  ↓ GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
Google Gemini API
```

- **프론트엔드**: React 19 + Tailwind CSS (정적 파일로 서빙)
- **백엔드**: Hono (Cloudflare Pages Functions) - Gemini API 프록시
- **API 키**: Cloudflare 시크릿으로 관리 (프론트엔드에 노출 안 됨)

## Features
- 스포츠/연예 기사 생성
- 신간도서 리뷰 기사 생성
- 보험/금융 전문 기사 생성
- 강의/행사/세미나 보도자료 생성
- 부동산 시장 분석 기사 생성
- 기업홍보 PR 기사 생성
- 인물 인터뷰 기사 생성
- 뉴스 리라이팅 (Google Search 연동)
- 생성된 기사 섹션별 복사 기능
- AI 기반 기사 리라이팅/수정 기능
- 파일 첨부 (이미지/문서) 지원
- 트렌딩 키워드 실시간 추천

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/generate/blog | 스포츠/연예 기사 생성 |
| POST | /api/generate/plan | 신간도서 기사 생성 |
| POST | /api/generate/newsletter | 보험/금융 기사 생성 |
| POST | /api/generate/event | 강의/행사/세미나 기사 생성 |
| POST | /api/generate/informative | 부동산 기사 생성 |
| POST | /api/generate/corporate | 기업홍보 기사 생성 |
| POST | /api/generate/interview | 인물인터뷰 기사 생성 |
| POST | /api/generate/news | 뉴스 리라이팅 |
| POST | /api/refine | 기사 수정/리라이팅 |
| POST | /api/trending-keywords | 트렌딩 키워드 조회 |
| POST | /api/best-article | 추천 기사 URL 조회 |
| POST | /api/article-fulltext | 기사 전문 추출 |

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: Active
- **Secret**: `GEMINI_API_KEY` (wrangler pages secret)
- **Last Updated**: 2026-03-12

## Setup
1. `npm install`
2. `.dev.vars`에 `GEMINI_API_KEY` 설정 (로컬 개발용)
3. `npm run build` (빌드)
4. `npm run preview` (로컬 미리보기)
5. 프로덕션: `npx wrangler pages secret put GEMINI_API_KEY --project-name kmedia-news`
