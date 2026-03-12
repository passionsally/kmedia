# 한국미디어창업뉴스 - AI 뉴스 기자 작성봇

## Project Overview
- **Name**: kmedia-news
- **Goal**: 한국미디어창업뉴스 기자를 위한 AI 기반 뉴스 기사 자동 생성 도구
- **AI Engine**: Google Gemini API (gemini-3-flash-preview, gemini-3-pro-preview)

## URLs
- **Production**: https://kmedia-news.pages.dev
- **GitHub**: https://github.com/passionsally/kmedia

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

## Tech Stack
- React 19 + TypeScript
- Vite 6 (빌드)
- Tailwind CSS (CDN)
- Lucide React (아이콘)
- Google Gemini API

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: Active
- **Last Updated**: 2026-03-12

## Setup
1. `npm install`
2. `.env.local`에 `GEMINI_API_KEY` 설정
3. `npm run dev` (개발) / `npm run build` (빌드)
