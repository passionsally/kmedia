import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GoogleGenAI } from '@google/genai'

const app = new Hono()

app.use('/api/*', cors())

// 에러 핸들링 미들웨어
app.onError((err, c) => {
  console.error('API Error:', err.message)
  const status = err.message.includes('API 키') ? 401 : 500
  return c.json({ error: err.message || '서버 오류가 발생했습니다.' }, status)
})

// 모든 /api/* 요청에서 X-API-Key 헤더로부터 사용자의 Gemini API 키를 추출
const getApiKey = (c: any): string => {
  const key = c.req.header('X-API-Key')
  if (!key) throw new Error('API 키가 제공되지 않았습니다.')
  return key
}

// ===== 프롬프트 상수 (geminiService.ts에서 이동) =====

const READABILITY_GUIDELINES = `
## 기사 작성 및 가독성 지침 (필수 준수)
1. **문체**: 반드시 엄격한 기사체(~다, ~밝혔다, ~전했다, ~분석된다)만을 사용하십시오. 경어체는 절대로 사용하지 마십시오.
2. **문장 길이**: 한 문장은 반드시 **100자에서 120자 내외**로 작성하십시오. 너무 짧거나 150자를 넘어가는 긴 문장은 지양하십시오.
3. **단락 구성**: 한 단락은 반드시 **두 개의 문장**으로만 구성하십시오. 단락 사이에는 가독성을 위해 반드시 빈 줄을 삽입하십시오.
4. **독창성**: 제공된 정보를 기자의 시각에서 완전히 새로운 문장으로 재구성하십시오. 문장 유사도를 최소화하십시오.
5. **필수 구성 요소**: 아래 식별자를 사용하여 정확히 구분해 출력하십시오. 식별자 사이에는 반드시 빈 줄을 두어 구분하십시오.
   - <<<NEWS_TITLE>>>: 클릭을 부르는 임팩트 있는 헤드라인
   - <<<NEWS_SUB>>>: 기사 핵심을 관통하는 부제목
   - <<<IMAGE_CAPTION>>>: 생생한 현장감을 담은 사진 설명 문구
   - <<<NEWS_LEAD>>>: 5W1H가 압축된 도입부 리드문 (2문장)
   - <<<NEWS_BODY>>>: 논리적이고 체계적인 기사 본문 (2문장씩 단락 구성)
   - <<<INTERVIEW_SECTION>>>: 관계자 인터뷰 (있는 경우에만 작성)
   - <<<ADMIN_TIP>>>: 발행 시 주의사항 및 기사 가치를 높이는 관리자용 팁 (!!!경고: 절대 <<<NEWS_BODY>>> 영역 내부에 <<<ADMIN_TIP>>>을 작성하지 마십시오. 반드시 기사 본문이 완전히 종료된 후 별도로 작성하십시오!!!)
`

const SPORTS_ENT_PROMPT = `## ROLE: 대한민국 1등 스포츠/연예 전문 선임기자. 팩트 기반의 날카로운 분석과 생동감 넘치는 문장력을 겸비한 전문가.`

const INTERVIEW_SPECIFIC_GUIDELINES = `
## 금지 사항 및 서식 제한 (엄격 준수)
1. **강조 표시 금지**: 출력 결과물에 볼드체(**), 이탤릭체(*), 헤더(#) 등의 마크다운 서식을 절대 사용하지 마십시오. 오직 순수한 텍스트만 출력하십시오.
2. **인터뷰 분리 금지**: 인터뷰 내용을 별도의 섹션으로 분리하지 마십시오. 기사 본문 안에 자연스럽게 서술하십시오.

## 작성 스타일 및 구조
1. **전체 분량**: 기사 본문은 공백 포함 **총 1000자 내외**로 작성하십시오.
2. **문체**: 간결하고 명확한 기사체(~다)를 유지하십시오.
3. **문장 및 단락 구성**:
   - 한 문장은 **80자 내외**로 끊어 쓰십시오.
   - 한 단락은 **250자 내외**, **두 문장** 정도로 구성하십시오.
4. **인터뷰 인용(필수)**:
   - 주요 인터뷰 대상의 말은 전체 기사 내에 **1~3개**만 선별하여 본문에 자연스럽게 포함시키십시오.
   - **관계자 코멘트 필수**: 기사 마지막 단락에는 반드시 관계자(또는 주최 측)의 코멘트를 넣어 마무리하십시오.

## 필수 출력 구성 요소
다음 태그를 사용하여 기사를 구성하십시오. 태그 사이에는 반드시 빈 줄을 두어 구분하십시오.
- <<<NEWS_TITLE>>>: 헤드라인
- <<<NEWS_SUB>>>: 부제목
- <<<IMAGE_CAPTION>>>: 사진 설명
- <<<NEWS_LEAD>>>: 리드문 (전체 요약)
- <<<NEWS_BODY>>>: 본문 (인터뷰 내용이 포함된 1000자 분량의 기사)
- <<<ADMIN_TIP>>>: 독자를 위한 실질적인 조언이나 활용 팁 (!!!경고: 절대 <<<NEWS_BODY>>> 영역 내부에 <<<ADMIN_TIP>>>을 작성하지 마십시오. 반드시 기사 본문이 완전히 종료된 후 별도로 작성하십시오!!!)
`

// ===== 헬퍼 =====

const fileToPart = (file: any) => ({
  inlineData: { data: file.data, mimeType: file.mimeType }
})

const getAI = (c: any) => new GoogleGenAI({ apiKey: getApiKey(c) })

// ===== API 엔드포인트 =====

// 트렌딩 키워드
app.post('/api/trending-keywords', async (c) => {
  const { field } = await c.req.json()
  const ai = getAI(c)
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `현재 대한민국 ${field} 분야에서 가장 조회수가 높거나 화제가 되는 뉴스 키워드 3가지만 단어 형태로 알려줘. (쉼표로 구분)`,
    config: { tools: [{ googleSearch: {} }] }
  })
  const keywords = (response.text || "").split(',').map(s => s.trim().replace(/^\d+\.\s*/, '')).filter(Boolean).slice(0, 3)
  return c.json({ keywords })
})

// 추천 기사 URL
app.post('/api/best-article', async (c) => {
  const { keyword } = await c.req.json()
  const ai = getAI(c)
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `'${keyword}'와 관련하여 현재 가장 반응이 좋고 공신력 있는 최신 뉴스 기사 1개의 URL과 제목을 알려줘.`,
    config: { tools: [{ googleSearch: {} }] }
  })
  const chunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0] as any
  if (chunk?.web) return c.json({ url: chunk.web.uri, title: chunk.web.title || keyword })
  return c.json({ url: '', title: keyword })
})

// 기사 전문 추출
app.post('/api/article-fulltext', async (c) => {
  const { url } = await c.req.json()
  const ai = getAI(c)
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 URL의 기사 내용을 검색하여 기사 제목과 본문 전체 내용을 그대로 텍스트로 추출해서 알려줘. 기사 내용 외의 광고나 UI 텍스트는 제외해줘. URL: ${url}`,
    config: { tools: [{ googleSearch: {} }] }
  })
  return c.json({ text: response.text || "" })
})

// 스포츠/연예 기사 생성
app.post('/api/generate/blog', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)
  const prompt = `${SPORTS_ENT_PROMPT}
[기사 요청 사항]
- 카테고리: ${params.lectureType}
- 대상 독자: ${params.targetAudience}
- 핵심 주제: ${params.lectureTopic}
- 취재 내용: ${params.lectureContent}
${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { tools: [{ googleSearch: {} }] }
  })
  return c.json({ text: res.text || "" })
})

// 신간도서 기사 생성
app.post('/api/generate/plan', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  const interviewInfo = params.interviews?.map((it: any, i: number) =>
    `${i + 1}. ${it.name || '미정'}(소속: ${it.affiliation || '미지정'}) - 대사: ${it.dialogue || 'AI 자동 생성 요청'}`
  ).join('\n')

  const prompt = `## ROLE: 도서 기획자 및 전문 리뷰어.
도서명: ${params.bookTitle}
장르: ${params.genre}
출판유형: ${params.publicationType}
저자유형: ${params.bookType}
작가소개: ${params.authorBio}
책소개글: ${params.bookIntro}
출판사서평: ${params.publisherReview}
구매링크: ${params.purchaseLink}

[인터뷰 대상자 목록]
${interviewInfo}

${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 보험/금융 기사 생성
app.post('/api/generate/newsletter', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  let extraInfo = ""
  if (params.referenceUrl) extraInfo += `\n- 참고 기사 URL: ${params.referenceUrl}`
  if (params.youtubeUrl) extraInfo += `\n- 관련 유튜브 영상: ${params.youtubeUrl}`
  if (params.sourceTitle) extraInfo += `\n- 참고 원문 제목: ${params.sourceTitle}`
  if (params.sourceBody) extraInfo += `\n- 참고 원문 내용: ${params.sourceBody}`

  const prompt = `## ROLE: 금융 전문 기자.
카테고리: ${params.category}
주제: ${params.topic}
대상 독자: ${params.targetAudience}
주요 내용: ${params.mainContent}

[참고 자료]${extraInfo}

${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 강의/행사/세미나 기사 생성
app.post('/api/generate/event', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  const interviewText = params.interviews?.map((i: any) =>
    `- ${i.name} (${i.affiliation || '소속미정'}, ${i.position || '직책미정'}): "${i.content}"`
  ).join('\n')

  let extraInfo = ""
  if (params.referenceUrl) extraInfo += `\n- 참고 기사 URL: ${params.referenceUrl}`
  if (params.youtubeUrl) extraInfo += `\n- 관련 유튜브 영상: ${params.youtubeUrl}`
  if (params.sourceTitle) extraInfo += `\n- 참고 원문 제목: ${params.sourceTitle}`
  if (params.sourceBody) extraInfo += `\n- 참고 원문 내용: ${params.sourceBody}`

  const prompt = `## ROLE: 언론홍보 보도자료 전문 기자.
[보도자료 작성 요청 정보]
- 기사 헤드라인 주제: ${params.headline}
- 강의/행사/세미나 주제: ${params.lectureTopic}
- 강사명/사회자/진행자: ${params.instructor}
- 대상: ${params.targetAudience}
- 주최 단체: ${params.organizer}
- 주최 교육기관: ${params.institution}
- 자격증 관련: 주무부처(${params.ministry}), 발급기관(${params.issuer}) (해당 사항 없으면 생략)
- 협력 단체: ${params.coOrganizer}
- 주요 내용: ${params.mainContent}

[참고 자료]${extraInfo}

[인터뷰 내용]
${interviewText}

${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 부동산 기사 생성
app.post('/api/generate/informative', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  let extraInfo = ""
  if (params.referenceUrl) extraInfo += `\n- 참고 기사 URL: ${params.referenceUrl}`
  if (params.youtubeUrl) extraInfo += `\n- 관련 유튜브 영상: ${params.youtubeUrl}`
  if (params.sourceTitle) extraInfo += `\n- 참고 원문 제목: ${params.sourceTitle}`
  if (params.sourceBody) extraInfo += `\n- 참고 원문 내용: ${params.sourceBody}`

  const interviewSection = params.interviews
    ?.filter((i: any) => i.name.trim())
    .map((i: any) => `- ${i.name} (${i.affiliation || '관계자'}): ${i.dialogue ? `"${i.dialogue}"` : '(문맥에 맞는 전문적인 코멘트를 생성하여 삽입)'}`)
    .join('\n') || '없음'

  const prompt = `## ROLE: 부동산 전문 기자.
지역: ${params.region}
주제: ${params.topic}
대상 독자: ${params.targetAudience}
주요 분석 내용: ${params.mainContent}

[인터뷰 대상자 (기사 본문에 자연스럽게 포함)]
${interviewSection}
(대사가 없는 경우 부동산 시장 전문가나 관계자의 톤앤매너에 맞는 멘트를 생성하여 본문에 자연스럽게 녹여내십시오.)

[참고 자료]${extraInfo}

${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 기업홍보 기사 생성
app.post('/api/generate/corporate', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  let extraInfo = ""
  if (params.homepageUrl) extraInfo += `\n- 홈페이지: ${params.homepageUrl}`
  if (params.referenceUrl) extraInfo += `\n- 참고 기사 URL: ${params.referenceUrl}`
  if (params.youtubeUrl) extraInfo += `\n- 관련 유튜브 영상: ${params.youtubeUrl}`
  if (params.sourceTitle) extraInfo += `\n- 참고 원문 제목: ${params.sourceTitle}`
  if (params.sourceBody) extraInfo += `\n- 참고 원문 내용: ${params.sourceBody}`

  const interviewSection = params.interviews
    ?.filter((i: any) => i.name.trim())
    .map((i: any) => `- ${i.name} (${i.affiliation || '관계자'}): ${i.dialogue ? `"${i.dialogue}"` : '(문맥에 맞는 신뢰감 있는 코멘트를 생성하여 삽입)'}`)
    .join('\n') || '없음'

  const prompt = `## ROLE: 기업 브랜딩 전문가.
[기업 정보]
- 기업명: ${params.companyName}
- 검색 노출 핵심 키워드: ${params.searchKeywords}
- 산업군: ${params.industry}
- 핵심 제품/서비스: ${params.coreProduct}
- 경영 철학: ${params.philosophy}
- CEO 메시지: ${params.ceoMessage}
- 홍보 목적: ${params.purpose}
- 타겟 고객: ${params.targetAudience}
- 톤앤매너: ${params.tone}

[인터뷰 대상자 (기사 본문에 자연스럽게 포함)]
${interviewSection}
(대사가 없는 경우 기업의 톤앤매너에 맞는 전문적인 멘트를 생성하여 본문에 자연스럽게 녹여내십시오.)

[참고 자료]${extraInfo}

${READABILITY_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 인물인터뷰 기사 생성
app.post('/api/generate/interview', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)

  let extraInfo = ""
  if (params.referenceUrl) extraInfo += `\n- 참고 기사 URL: ${params.referenceUrl}`
  if (params.youtubeUrl) extraInfo += `\n- 관련 유튜브 영상: ${params.youtubeUrl}`
  if (params.sourceTitle) extraInfo += `\n- 참고 원문 제목: ${params.sourceTitle}`
  if (params.sourceBody) extraInfo += `\n- 참고 원문 내용: ${params.sourceBody}`

  const additionalInterviews = params.interviews
    ?.filter((i: any) => i.name.trim())
    .map((i: any) => `- ${i.name} (${i.affiliation || '소속미정'}): ${i.dialogue ? `"${i.dialogue}"` : '(문맥에 맞는 자연스러운 대사를 생성하여 삽입)'}`)
    .join('\n') || '없음'

  const prompt = `## ROLE: 인물 인터뷰 전문 기자.
[인터뷰 대상 정보]
- 성명: ${params.intervieweeName}
- 소속/직함: ${params.intervieweeRole}
- 인터뷰 주제: ${params.topic}
- 기사 헤드라인: ${params.headline}
- 주요 인터뷰 내용(Q&A): ${params.interviewContent}

[추가 인터뷰이 목록 (기사 본문에 자연스럽게 인용 포함)]
${additionalInterviews}
(대사가 없는 경우 기사 문맥에 어울리는 내용을 생성하여 자연스럽게 녹여내십시오.)

[참고 자료]${extraInfo}

${INTERVIEW_SPECIFIC_GUIDELINES}`

  const parts: any[] = [{ text: prompt }]
  if (params.referenceFiles) params.referenceFiles.forEach((f: any) => parts.push(fileToPart(f)))

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  })
  return c.json({ text: res.text || "" })
})

// 뉴스 리라이팅
app.post('/api/generate/news', async (c) => {
  const params = await c.req.json()
  const ai = getAI(c)
  const prompt = `## ROLE: 뉴스 리라이터 전문 AI 선임기자.
[요청 정보]
- 분야: ${params.newsField}
- 유형: ${params.articleType}
- 참고URL: ${params.refUrls.filter((u: string) => u.trim()).join(', ')}
- 원문내용: ${params.mainContent}

[리라이팅 핵심 원칙]
1. 원문의 정보를 유지하되, 완전히 새로운 구조와 문장으로 재창조하십시오.
2. 모든 단락은 2문장으로 구성하며, 각 문장은 100~120자 사이의 길이를 유지하십시오.
3. 기사체(~다)를 엄격히 준수하고 불필요한 수식어는 배제하십시오.
${READABILITY_GUIDELINES}`

  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  })
  return c.json({
    text: res.text || "",
    groundingSources: res.candidates?.[0]?.groundingMetadata?.groundingChunks
  })
})

// 기사 수정/리파인
app.post('/api/refine', async (c) => {
  const { original, instruction } = await c.req.json()
  const ai = getAI(c)
  const prompt = `원본을 수정 요청 사항에 맞춰 업데이트하십시오. 반드시 기사 작성 지침(한 문장 100-120자, 한 단락 2문장)을 유지하십시오.\n요청: ${instruction}\n\n원본:\n${original}`
  const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt })
  return c.json({ text: res.text || "" })
})

export default app
