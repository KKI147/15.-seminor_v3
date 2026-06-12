# 포켓몬 디펜스

[PokeAPI/sprites](https://github.com/PokeAPI/sprites) CDN 스프라이트를 쓰는 **타워 디펜스** 데모입니다.  
PixiJS(필드·전투) + jQuery(DOM 그리드·HUD) + `common/` 프레임워크(`#wrap` 1920×1020 스케일) 구조입니다.

**상세 규칙**: [`docs/game-mechanics.md`](docs/game-mechanics.md)

https://kki147.github.io/defense/

---

## 로컬 실행

```bash
npx serve -p 3456
```

**스모크 테스트** (서버 실행 중):

```bash
node scripts/test-defense-logic.js
npm install playwright --no-save
node scripts/test-browser.mjs
```

브라우저: `http://localhost:3456/index.html`  
(`file://`로 열면 Pixi/스프라이트 로드가 실패할 수 있습니다.)

### 전설 5종 테스트 지급 (개발용)

전설 조합 대상 **144 프리져 · 145 썬더 · 146 파이어 · 150 뮤츠 · 151 뮤** 를 보관함에 한 번에 넣습니다.  
(보관함·말판에 이미 있으면 기본적으로 **생략** — `force`로 무시 가능)

1. `npx serve -p 3456` 로 게임 페이지 연 뒤 **F12 → 콘솔**
2. 아래 실행:

```javascript
DefenseDemo.grantTestLegendariesAll();
```

| 옵션 | 호출 | 설명 |
|------|------|------|
| 기본 | `DefenseDemo.grantTestLegendariesAll()` | 없는 종만 1마리씩 지급 |
| 강제 | `DefenseDemo.grantTestLegendariesAll(true)` | 기보유여도 보관함에 각 1마리 추가 |

반환값 예: `{ added: 5, skipped: 0, ids: [144, 145, 146, 150, 151] }`  
지급 후 **보관함**·**전설 조합** 패널에서 `is-owned`(파란 카드·「보유」) 표시를 확인할 수 있습니다.

구현: `js/gameDemo.js` → `grantTestLegendariesAll` (공개 API)

---

## 조작 요약

| 버튼 / 조작 | 설명 |
|-------------|------|
| **뽑기 GACHA** | 남은 **뽑기권 전부** 소모 → **보관함**에 1단 포켓몬 추가 |
| **리롤 (3→1장)** | 보관함에서 **3마리 선택** → **뽑기권 +1** (보관함 3마리 이상 필요) |
| **전설 조합** | 보관함 **「전설 조합」** — 재료 소모 후 144~151 획득 ([`legendary-combos.md`](docs/legendary-combos.md)) |
| **정렬** | 같은 계열·단계끼리 보관함 묶음 |
| **일괄배치** | 보관함 전체를 역할 우선(슬로우→버프→범위→단일)으로 말판 배치 |
| **보관함 → 말판** | 카드 드래그로 빈 칸 배치 |
| **말판 → 보관함** | 타워 드래그 후 보관함 패널 위에서 놓기 |
| **말판 타워 클릭** | 강화 패널 + **사거리 원** 표시 |
| **같은 타워 재클릭** | 선택 해제 · **사거리 원 숨김** |
| **말판 타워 드래그** | 빈 칸 이동 (웨이브 중에도 가능) |
| **게임 START** | 말판 타워 1기 이상 필요 |
| **웨이브 SKIP** | 대기 생략 또는 겹침 스폰 — **뽑기권 +3** |
| **리셋** | 전체 초기화 |

---

## 게임 규칙 (요약)

### 패배 · 순환

- **필드 적 100마리 이상** → 게임오버
- 적 경로 완주 시 **제거 없이 재순환** (누수·통과 패배 없음)

### 뽑기권

- 시작 **5장**
- **라운드 제한 1분 경과** → **+3** · **SKIP** 1회 → **+3** · **보스** → **+5**
- ~~웨이브 클리어~~ 뽑기권 없음

### ROUND · 타이머 · 보스

- 웨이브당 **30마리** · 클리어 후 **2.8초** 대기 → 다음 ROUND
- **라운드 제한 1분** — **웨이브마다 리셋하지 않음** · START·시간 초과 보상 후만 1:00 리셋
- 초과 시 다음 ROUND 웨이브 자동 추가 (HUD 표시) · 대기 중 타이머 일시정지
- **10·20·30… ROUND** — **전설·환상 보스** 1마리 (`getBossIdForRound`)
- 보스 처치: **뽑기권 +5**

### 타워 · 진화 · 역할

- **10×10** 그리드 · **1단×2 / 2단×3 합성** → 다음 단계
- **이브이**: 2마리 합성 후 샤미드/쥬피썬더/부스터 선택
- **역할**: 진화 가능→**단일/범위** (45:30), 무진화→**슬로우/버프** (15:10) — [`docs/role-system.md`](docs/role-system.md)
- **전설 5종**: **단일·범위만** (슬로우·버프·유틸 강화 없음) — [`docs/legendary-combos.md`](docs/legendary-combos.md)
- **속성**: 단일 역할만 · **등급**: 라인 깊이별 (3단 라인 1단 / 2단 라인 1단 / 무진화 / 2·3단) — [`docs/role-system.md`](docs/role-system.md)

### 관동 뽑기

- 1~151 · 1단만 · 전설 5종(144~146,150~151) **뽑기 제외**
- **가중 뽑기** — 3단 계열 가중 **4** (≈54%) > 2단 ≈30% > 무진화 ≈16%  
  → [`docs/gen1-gacha-policy.md`](docs/gen1-gacha-policy.md) · 진화 루트 [`docs/evolution-routes-gen1.md`](docs/evolution-routes-gen1.md)

---

## UI 구성

| 영역 | 내용 |
|------|------|
| **왼쪽 — 보관함** | 뽑기 결과, 정렬, 일괄배치, 역할·속성 뱃지, **진화 가능 깜빡임** |
| **중앙 — 체육관 맵** | Pixi 관중석·트랙·나무 배틀 존 + DOM 그리드(배치 시만 하이라이트) · **합성 가능 칸 `evo-ready`** |
| **오른쪽 — 상태** | 몹 수, 필드 N/100, 뽑기권 (제한시간·SKIP), 처치, 웨이브, **라운드 타이머**, **역할 가이드** |
| **오른쪽 — 강화** | 타워 클릭 시 진화·스탯·**현재 사거리** |
| **타워 우하단** | 역할 아이콘 (●단일 ○범위 ▲슬로우 ···버프) — **`uiLayer`** (스프라이트 위) |
| **전설 타워** | 금색 링 오라 + 역할 뱃지 **금테·★** · 보관함 **금색 카드** |
| **무진화 강화** | 말판 **우상단 `1`/`2`** · 보관함·패널 숫자 뱃지 (`uiLayer`) |
| **전설 조합 패널** | 맵 위 오버레이 · 보유 시 **파란 카드·「보유」** |
| **하단** | 뽑기, 리롤, START, SKIP, 리셋, 메시지 |

---

## 파일 구조

```
defense/
├── readme.md
├── index.html
├── script.js                      ← #wrap 준비 후 DefenseDemo.init
├── js/
│   ├── gameDemo.js                ← 메인 (DefenseDemo)
│   ├── pokemonConfig.js           ← CDN, 적 HP, 보스, 리롤, 관동 뽑기
│   ├── pokemonEvolutionLines.js     ← 진화 계열 참고
│   └── pokemonThreeStageIds.js    ← (참고용, 미로드)
├── css/
│   └── demo.css                   ← HUD, 오라, 역할·사거리 UI
├── docs/
│   ├── game-mechanics.md          ← ★ 게임 규칙 전체 (구현 기록)
│   ├── role-system.md             ← 역할·스탯·연출·UI
│   ├── evolution-routes-gen1.md   ← ★ 관동 진화 루트 (GEN1_GACHA_LINES)
│   ├── gen1-gacha-policy.md       ← 관동 뽑기·리롤·보스·이브이
│   ├── legendary-combos.md        ← 전설 5종 조합표
│   ├── type-passives.md           ← 속성 상성 · 역할 패시브
│   ├── pokemon-sprites.md
│   └── pokemon-sprite-ids.json
├── common/                        ← 프레임워크 (직접 수정 지양)
├── assets/
│   └── map-gym-field.png          ← 체육관 맵 900×900
├── scripts/
│   ├── generate-gym-map.js        ← 맵 PNG 재생성
│   ├── calc-gacha-role-rates.js   ← 뽑기 확률표 (가중·역할)
│   ├── test-defense-logic.js      ← 설정·상성·에셋 스모크
│   └── test-browser.mjs           ← Playwright HUD 스모크
│   (브라우저 콘솔) DefenseDemo.grantTestLegendariesAll() ← 전설 5종 테스트 지급
```

### 스크립트 로드 순서

1. `pokemonEvolutionLines.js`
2. `pokemonConfig.js`
3. `gameDemo.js` → `DefenseDemo`

---

## 주요 상수

| 항목 | 값 | 위치 |
|------|-----|------|
| `FIELD_LIMIT` | 100 | `pokemonConfig.js` |
| `waveTotal` | 30 | `gameDemo.js` |
| `TICKET_TIMER_REWARD` | +3 (1분 경과) | `gameDemo.js` |
| `TICKET_SKIP_REWARD` | +3 (SKIP) | `gameDemo.js` |
| `TICKET_BOSS_REWARD` | +5 (보스 처치) | `gameDemo.js` |
| `ROUND_LIMIT_MS` | 60000 (1분) | `gameDemo.js` |
| `BOSS_EVERY_ROUNDS` | 10 | `pokemonConfig.js` |
| `MERGE_REQUIRED_STAGE1` | 2 (1단→2단) | `gameDemo.js` |
| `MERGE_REQUIRED_STAGE2` | 3 (2단→3단) | `gameDemo.js` |
| `REROLL_TRADE_COUNT` | 3 → +1장 | `pokemonConfig.js` |
| `GACHA_WEIGHT_STAGE3` | 4 (3단 우선) | `pokemonConfig.js` |
| `GACHA_WEIGHT_STAGE2` / `NO_EVO` | 1 | `pokemonConfig.js` |
| 적 HP | 105 + r×42 + r²×1.9 (라운드↑) | `pokemonConfig.js` |
| 적 속도 | 라운드 고정 · 보스 ×0.72 | `getEnemySpeed()` |
| 유틸 강화 | 2합 → 티어 1·2 | `gameDemo.js` |
| `LEGENDARY_AURA_RADIUS` | 24 (말판 금링) | `gameDemo.js` |
| 필드 UI 레이어 | `getFieldUiLayer()` → `uiLayer` | `gameDemo.js` |
| 필드 | 900×900, 10×10 그리드 | `gameDemo.js` |

단계·역할·등급 스탯: `STAGE_STATS`, `ROLE_PROFILE`, `POWER_TIER_MUL` — [`docs/role-system.md`](docs/role-system.md)

---

## 경로

스폰 기준 **↓ → → ↑ ←** 사각 루트. 적 완주 시 progress 리셋 후 재순환.

---

## PokeAPI 스프라이트

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
```

- 아군·적: PNG · 공격 연출 GIF(선택)  
- 상세: [`docs/pokemon-sprites.md`](docs/pokemon-sprites.md)

---

## 기술 메모

- Pixi v7.4.2 · DOM 그리드 오버레이로 배치/드래그
- `activeWaves[]` — 웨이브 겹침·`waveUid` 적 소속
- 적 facing: `scale.x` 좌우 반전 (회전 없음)
- `common_sci.css` 전역 검은 글자 → `demo.css`에서 `#defense-demo` 밝은색 상속
- JS: `function` 문법, `let`/`const`, jQuery, 주석 한국어

---

## 구현 체크리스트

### 코어

- [x] CDN 스프라이트 · 경로 순환 · 필드 100마리 패배
- [x] 뽑기권(제한시간·SKIP +3, 보스 +5) · 보관함 · 드래그 배치/회수
- [x] **1단×2 / 2단×3** 합성 진화 · 이브이 분기 · START/SKIP/리셋

### ROUND · 보스

- [x] 라운드 **1분 타이머** · 시간 초과 겹침 스폰
- [x] **전설 보스** 10ROUND마다 · 순환 ID · 큰 UI
- [x] 보스 처치 뽑기권 · 라운드별 **적 HP 상승** (이동 속도 고정)
- [x] **무진화 유틸 강화** — 슬로우·버프 2합 → 1/2 · [`docs/role-system.md`](docs/role-system.md) §유틸 강화

### 역할 · 밸런스

- [x] 단일/범위/슬로우/버프 · 진화별 역할(45/30/15/10)
- [x] **가중 뽑기** — 3단 ≈54% > 2단 ≈30% > 무진화 ≈16%
- [x] **단일만 속성** · 등급 배율(라인 깊이별 1단·2단 최종)
- [x] 역할별 공격 연출 · 일괄배치 우선순위
- [x] 버프 오라 테두리 강화 · 강화 숫자 UI 위치 조정
- [x] **전설** — 단일/범위 고정 · 말판 `uiLayer` 뱃지·금링 · 조합 패널 보유 표시

### UI · 연출

- [x] 타워 **역할 아이콘** · 오른쪽 **역할 가이드**
- [x] 타워 클릭 **사거리 원** · 재클릭 해제
- [x] 버프 수혜 **빨간 ▲** · 슬로우 **서리 결정**
- [x] **진화 가능 UI** — 보관함·말판 깜빡임 · 「진화!」뱃지
- [x] **리롤** 보관함 3→뽑기권 1
- [x] **체육관 맵** — 관중석·적 트랙·나무 배틀 존 · HUD 패널 톤 통일

### 테스트 · 안정화

- [x] `node scripts/test-defense-logic.js` — 설정·전설 조합·맵·CSS·상성
- [x] `node scripts/test-browser.mjs` — Playwright (init·전설·뽑기·START)
- [x] 밸런스 플레이 테스트 (체감 OK)
- [x] 뽑기권 타이머 버그 수정 (`startWave`마다 리셋 제거)
- [x] 스프라이트 `scale` null 방어 (`isUnitSpriteLive`)
- [x] `grantTestLegendariesAll()` — 전설 5종 테스트 지급 (readme §개발용)
- [x] 전설 말판 UI — `uiLayer` 역할 뱃지·금링 · 텍스처 CDN 자동 로드

### 문서

- [x] [`docs/game-mechanics.md`](docs/game-mechanics.md) — 전체 규칙 · §14~15 변경·테스트
- [x] [`docs/role-system.md`](docs/role-system.md) · [`docs/gen1-gacha-policy.md`](docs/gen1-gacha-policy.md)

### 선택 (미완)

- [x] 전설 5종 조합 획득 — [`docs/legendary-combos.md`](docs/legendary-combos.md)
- [x] 체육관 맵 PNG — `assets/map-gym-field.png` (`scripts/generate-gym-map.js`)
- [ ] `assets/` · `pokemonThreeStageIds.js` 정리
- [x] **속성 상성** · **역할 패시브** — [`docs/type-passives.md`](docs/type-passives.md)

---

## 최근 변경 (문서)

| 문서 | 내용 |
|------|------|
| [`game-mechanics.md`](docs/game-mechanics.md) | §11 전설 · §14~15 변경·테스트 · 필드 UI·타이머·유틸·가중 뽑기 |
| [`legendary-combos.md`](docs/legendary-combos.md) | 역할표 · 말판/보관함 UI · 테스트 지급 API |
| [`gen1-gacha-policy.md`](docs/gen1-gacha-policy.md) | 가중 뽑기 · 전설 역할 정책 |
| [`role-system.md`](docs/role-system.md) | 전설·`uiLayer` 필드 UI · 유틸·오라 |
| [`type-passives.md`](docs/type-passives.md) | 레이저 상성 · 변경 이력 |

---

## 참고 링크

- [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
- [스프라이트 가이드](docs/pokemon-sprites.md)
- [게임 메커니즘](docs/game-mechanics.md)
