# Dashboardity

Grafana 스타일 대시보드: **대시보드 엔진 + 위젯 라이브러리 + 앱 쉘 + 데모 앱** 구조.

## 구조

```
├── src/                 # 라이브러리 소스
│   ├── core/            # 대시보드 엔진 (레이아웃, 스펙 해석, JSON → 렌더링)
│   ├── widget-wrapper/  # Widget 공통 래퍼 (header, padding, error, empty)
│   ├── app-shell/       # TopBar, SideNav, DashboardPicker, TimeRangePicker
│   ├── data-adapter/    # API → 위젯 입력 포맷 변환
│   └── shared/          # types, utils, theme
├── examples/
│   └── playground/      # 위젯/대시보드 테스트용 앱
└── package.json
```

## 위젯 (사용자 정의)

**기본 위젯은 내장하지 않습니다.** `WidgetDefinition` / `WidgetProps` 타입에 맞춰 위젯을 만들고 `createWidgetRegistry`로 등록해 사용합니다.

```ts
import { createWidgetRegistry, type WidgetDefinition } from "dashboardity";

// 자체 위젯 정의 후
const widgetRegistry = createWidgetRegistry({
  stat: MyStatWidget,
  text: MyTextWidget,
});
```

## App shell / 커스텀 픽커

`TopBar`에 `dashboardPicker`, `timeRangePicker` 슬롯이 있습니다. 기본 제공 컴포넌트를 쓰거나, **자기 걸** 넣을 수 있습니다.

```tsx
import { TopBar, DashboardPicker, TimeRangePicker } from "dashboardity";

// 기본 픽커 사용
<TopBar
  title="My App"
  dashboardPicker={<DashboardPicker options={...} value={...} onChange={...} />}
  timeRangePicker={<TimeRangePicker value={...} onChange={...} />}
/>

// 커스텀 픽커 사용 (같은 props 타입 사용 가능: DashboardPickerProps, TimeRangePickerProps)
<TopBar
  title="My App"
  dashboardPicker={<MyDashboardPicker ... />}
  timeRangePicker={<MyTimeRangePicker ... />}
/>
```

`dashboardPicker` / `timeRangePicker`를 넘기지 않으면 해당 슬롯은 비고, `children`으로만 우측 영역을 채울 수 있습니다.

## 시작하기

### 요구 사항

- Node 18+

### 의존성 (외부)

- `@dashboardity/layout-core`, `@dashboardity/layout-store`, `react-griditty` — npm `^1.0.0` 사용.

**로컬 개발만 할 때:** npm에 아직 안 올렸다면 `npm overrides` 또는 로컬 `file:` 로 임시 지정 가능.

### 설치 및 실행

```bash
npm install
npm run build      # 라이브러리 빌드
npm run example    # playground 앱 실행
```

### 스크립트

- `npm run build` — 라이브러리 빌드 (tsup)
- `npm run dev` — 라이브러리 watch 빌드
- `npm run example` — playground 앱 실행 (Vite)
- `npm run clean` — dist 삭제

### npm install 오류 시 (`Cannot read properties of null (reading 'matches')`)

이전에 pnpm을 쓰던 폴더이거나 캐시 문제일 수 있습니다. **프로젝트 루트**에서 순서대로 시도하세요.

```bash
# 1) node_modules·lock 삭제
rmdir /s /q node_modules
del package-lock.json

# 2) npm 캐시 정리
npm cache clean --force

# 3) npm 최신으로 업데이트 (선택)
npm install -g npm@latest

# 4) 다시 설치
npm install
```

PowerShell: `node_modules` 삭제는 `Remove-Item -Recurse -Force node_modules`, lock 삭제는 `Remove-Item package-lock.json -ErrorAction SilentlyContinue`

## 배포 (npm + Git)

1. **Git**
   - `package.json`의 `repository.url`에 실제 저장소 URL 넣기 (예: `"url": "https://github.com/사용자/react-dashitty.git"`).
   - `git add .` → `git commit` → `git remote add origin ...` → `git push -u origin main` (또는 기본 브랜치 이름).

2. **npm**
   - [npmjs.com](https://www.npmjs.com) 로그인: 터미널에서 `npm login`.
   - 패키지 이름이 이미 쓰였으면 `package.json`의 `name`을 바꾸거나 스코프 사용 (예: `@내계정/dashboardity`).
   - `npm run build` 후 `npm publish`. (`prepublishOnly`로 publish 시 자동 빌드됨.)
   - 비공개 패키지가 아니면 스코프 패키지 첫 배포 시: `npm publish --access public`.

`dist/`는 `.gitignore`에 있어서 Git에는 안 올라가고, `npm publish` 시에만 `files: ["dist"]`로 포함됩니다.

## 스펙 → 렌더링

대시보드는 JSON 스펙으로 정의됩니다.

```ts
DashboardSpec
  └─ panels[]
      └─ widgets[]   // type + options + dataSourceId
layout.items[]       // grid 좌표 (layout-store)
```

Grid 계산은 `@dashboardity/layout-core` / `@dashboardity/layout-store`를 사용하며, 위젯은 width/height만 신경 쓰면 됩니다.
