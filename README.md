# Global Trend Analyzer (글로벌 트렌드 분석기)

전 세계의 실시간 트렌드를 분석하고, AI를 통해 그 원인을 요약해주는 웹 서비스입니다.

## 🚀 주요 기능 (Features)

1.  **실시간 트렌드 파악 (Real-time Trends)**
    -   Google News RSS ("Top Stories")를 기반으로 국가별 급상승 이슈를 수집합니다.
    -   **AI 키워드 추출**: 긴 뉴스 헤드라인에서 핵심 키워드(1~3단어)만 AI가 자동으로 추출하여 깔끔하게 보여줍니다.

2.  **AI 인사이트 (AI Insight)**
    -   선택한 트렌드에 대해 "왜 떴는지"를 한 줄로 요약해줍니다.
    -   **한국어 요약**: 어떤 국가(미국, 일본 등)를 선택하더라도 요약 결과는 항상 **한국어**로 제공됩니다.
    -   Powered by **Google Gemini 2.0 Flash**.

3.  **멀티미디어 & 소셜 버즈 (Multimedia & Social)**
    -   **관련 영상**: 해당 키워드와 관련된 YouTube 영상을 자동으로 찾아 보여줍니다.
    -   **소셜 반응**: Reddit 등 커뮤니티의 관련 반응을 함께 보여줍니다.
    -   **퀵 링크**: YouTube, Reddit, Twitter(X), Instagram, Threads, TikTok, Google 검색 바로가기 버튼 제공.
    -   *참고: Reddit 자동 데이터 수집은 API 제한으로 인해 현재 비활성화되었습니다.*

4.  **국가별 필터링 (Country Selector)**
    -   미국(US), 한국(KR), 일본(JP), 영국(GB), 인도(IN), 브라질(BR), 프랑스(FR), 독일(DE) 등 주요 국가 지원.

5.  **무한 스크롤 (Infinite Scroll)**
    -   기본 15개 노출 후, "Load More" 버튼을 통해 최대 50위까지 확인 가능.

6.  **종합 랭킹 시스템 (Comprehensive Ranking System)**
    -   단순 뉴스 순위를 넘어, 소셜 미디어와 동영상 반응을 종합하여 **"Trend Score"**를 산출합니다.
    -   **산정 방식 (Scoring Logic)**:
        -   **기본 점수 (Base Score)**: `51 - 뉴스 순위` (1위 = 50점, 50위 = 1점)
        -   **소셜 보너스 (Social Bonus)**: *현재 비활성화 (0점)*
        -   **비디오 보너스 (Video Bonus)**: `관련 영상 수 * 2` (최대 20점, 10개 이상 시 만점)
        -   **검색 흥미도 (Search Interest)**: `Google Trends 관심도 / 5` (최대 20점, *실험적 기능*)
    -   **총점**: 위 항목의 합산 (최대 90점)
    -   **투명성**: 각 트렌드 카드의 점수에 마우스를 올리면 점수 산정 내역을 확인할 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Framer Motion (Animations)
-   **AI**: Vercel AI SDK + Google Gemini API (`gemini-2.0-flash`)
-   **Data Sources**:
    -   Google News RSS (Trends)
    -   `rss-parser` (News Fetching)
    -   `youtube-search-api` (Video Search): YouTube 검색 결과 스크래핑 (API Key 불필요)
    -   Reddit JSON API (Social Search)

## 📂 프로젝트 구조 (Project Structure)

```
src/
├── app/
│   ├── api/                # Backend API Routes
│   │   ├── trends/         # 트렌드 목록 조회 (Google News RSS)
│   │   ├── context/        # 뉴스, 영상, 소셜 데이터 수집
│   │   └── summary/        # AI 요약 생성 (Gemini)
│   └── page.tsx            # 메인 페이지
├── components/
│   ├── TrendDashboard.tsx  # 메인 대시보드 컨테이너
│   ├── TrendCard.tsx       # 개별 트렌드 카드 (확장형 UI)
│   └── CountrySelector.tsx # 국가 선택 드롭다운
└── lib/
    ├── trends.ts           # 트렌드 데이터 파싱 및 AI 키워드 추출 로직
    ├── news.ts             # 뉴스 RSS 파싱 유틸리티
    └── social.ts           # YouTube 및 Reddit 데이터 수집 유틸리티
```

## 🏁 실행 방법 (Getting Started)

1.  **환경 변수 설정**
    `.env.local` 파일을 생성하고 Google Gemini API 키를 입력하세요.
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
    ```

2.  **의존성 설치**
    ```bash
    npm install
    ```

3.  **개발 서버 실행**
    ```bash
    npm run dev
    ```
    브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 📝 라이선스
This project is for educational purposes.
