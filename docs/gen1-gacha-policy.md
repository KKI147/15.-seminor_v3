# 관동(1~151) 뽑기/진화 정책

## 기준 출처

- 관동 도감(1~151) 참고: [관동지방 포켓몬 총정리(1번 이상해씨~151번 뮤)](https://m.blog.naver.com/rpgrr123/222185073223)
- **진화 루트 전체 표**: [`evolution-routes-gen1.md`](evolution-routes-gen1.md)

## 뽑기 정책

- 랜덤 뽑기는 **1~151 범위만** 사용 (`GEN1_GACHA_LINES`)
- 진화 라인이 있는 포켓몬은 **각 라인의 첫 단계(line[0])만** 등장
- 진화체가 없는 포켓몬은 단일 라인(`[id]`)으로 등장
- **[뽑기 GACHA]**: 남은 **뽑기권 전부** 소모 → 보관함 추가 (말판 자동 배치 없음)

### 가중 뽑기 (계열 깊이)

계열마다 균등이 아니라 **깊이별 가중치** (`pickWeightedGachaLine`):

| 깊이 | 가중 | 1회 뽑기 확률(근사) |
|------|------|---------------------|
| **3단 진화** | **4** | **≈54%** |
| 2단 진화 | 1 | ≈30% |
| 무진화 | 1 | ≈16% |

상수: `GACHA_WEIGHT_STAGE3`, `GACHA_WEIGHT_STAGE2`, `GACHA_WEIGHT_NO_EVO` (`pokemonConfig.js`)

역할(단일/범위/슬로우/버프)은 계열이 정해진 뒤 `getRoleForBaseId`로 결정 — 가중과 별개.

**가중 적용 후 역할(근사):** 단일 **≈52%** · 범위 **≈32%** · 슬로우 **≈10%** · 버프 **≈6%**  
(재계산: `node scripts/calc-gacha-role-rates.js`)

**균등(구) 참고:** 3단 23% · 2단 50% · 무진화 27% — 계열 **개수**만 반영한 값.

## 조합 전용(랜덤 뽑기 제외)

- **144** 프리져
- **145** 썬더
- **146** 파이어
- **150** 뮤츠
- **151** 뮤

위 5종은 `GEN1_COMBO_ONLY_IDS` — 랜덤 뽑기 제외, **전설 조합**으로만 획득.

**조합표·진행 순서**: [`legendary-combos.md`](legendary-combos.md) · `LEGENDARY_COMBOS` (`pokemonConfig.js`)

## 보스 전설 (뽑기와 별도)

- ROUND 10·20·30…마다 **전설·환상 보스** 등장
- 풀: `LEGENDARY_BOSS_IDS` (`pokemonConfig.js`) — 다세대 전설 ID 순환
- 함수: `getBossIdForRound(round)` — 10ROUND마다 풀에서 다음 ID
- **관동 뽑기 제외 5종**과 **보스 전설 풀**은 목적이 다름 (플레이어 뽑기 vs 보스 전투)

## 리롤

| 항목 | 값 |
|------|-----|
| 버튼 | **리롤 (3→1장)** |
| 조건 | 보관함 포켓몬 **3마리 이상** |
| 동작 | 보관함에서 **3마리 선택·교환** → **뽑기권 +1** |
| 상수 | `REROLL_TRADE_COUNT=3`, `REROLL_REWARD_TICKETS=1` |

뽑기권을 소모해 후보 3마리 중 1마리를 고르는 방식이 **아닙니다**.

## 합성 진화

| 단계 | 필요 | 상수 / 함수 |
|------|------|-------------|
| 1단 → 2단 | **2마리** (동일 계열·동일 단계) | `MERGE_REQUIRED_STAGE1`, `getMergeRequired(0)` |
| 2단 → 3단 | **3마리** | `MERGE_REQUIRED_STAGE2`, `getMergeRequired(1)` |
| 이브이(133) → 분기 | **2마리** | `performEeveeBranchMerge()` / `performEeveeBranchStorageMerge()` |

- 말판: `performMerge()` · 보관함: `performStorageMerge()`
- ~~전 단계 3마리 고정~~ (밸런스 조정으로 폐지)

## 뽑기권 (뽑기와 별도)

- **1분 타이머 만료 +3**, **SKIP +3**, **보스 처치 +5**
- 웨이브 클리어·일반 처치 보상 **없음**
- 타이머는 **웨이브 시작마다 리셋하지 않음** (`beginGame` · 시간 초과 보상 후만 1:00)
- 상세: [`game-mechanics.md`](game-mechanics.md) §5

## 이브이(133) 분기 진화

- 뽑기: **133 이브이**만 등장 (라인: `[133, 134, 135, 136]`)
- **이브이 2마리 합성** 후 선택:
  - **134** 샤미드 (Vaporeon)
  - **135** 쥬피썬더 (Jolteon)
  - **136** 부스터 (Flareon)
- 진화체는 **2단(최종)** — 추가 진화 없음
- 설정: `EEVEE_BRANCHES`, `performEeveeBranchMerge()`

## 역할·속성 (뽑기 결과)

- 역할: `getRoleForBaseId(line[0], line)` — **진화 가능** → 단일·범위(45:30), **무진화** → 슬로우·버프(15:10)
- **전설 5종**: 뽑기 제외 · 조합 획득 후 **단일/범위만** (`LEGENDARY_COMBOS.role`) — [`legendary-combos.md`](legendary-combos.md)
- 속성: **단일 역할** 포켓몬만 8속성 중 1개 부여
- 상세: [`role-system.md`](role-system.md)

## 설정 파일

| 파일 | 내용 |
|------|------|
| `js/pokemonConfig.js` | `GEN1_GACHA_LINES`, `GEN1_COMBO_ONLY_IDS`, `LEGENDARY_COMBOS`, `LEGENDARY_BOSS_IDS`, 리롤·보스 상수 |
| `docs/legendary-combos.md` | 전설 조합표·진행 순서 |
| `js/gameDemo.js` | 보관함·리롤 UI·역할·전투·합성·진화 UI |
| `docs/game-mechanics.md` | 전체 게임 규칙 |

## 역할 시스템 (상세)

- [`docs/role-system.md`](role-system.md)

## 변경 이력 (요약)

- 합성 **1단×2 / 2단×3**, 이브이 **2마리**
- 뽑기권: **타이머 +3**, **SKIP +3**, **보스 +5** · `grantTickets()` 통일 · 웨이브마다 타이머 리셋 **제거**
- 뽑기: **3단 계열 가중 4** (3단 ≈54% > 2단 ≈30% > 무진화 ≈16%)
- **전설**: 조합 전용 · 역할 **단일/범위** · 말판 `uiLayer` UI · `grantTestLegendariesAll()`
- 전체: [`game-mechanics.md`](game-mechanics.md) §11 · §14~15

## 테스트 · 검증

| 항목 | 방법 | 결과 |
|------|------|------|
| 설정·전설·맵 | `node scripts/test-defense-logic.js` | 통과 |
| HUD 스모크 | `node scripts/test-browser.mjs` (serve 3456) | 통과 |
| 가중 확률표 | `node scripts/calc-gacha-role-rates.js` | 3단·역할 비율 출력 |
| 뽑기권 체감 | 플레이 — 웨이브 연속 시 타이머 유지 | 수정 후 OK |
| 가중 뽑기 | 다회 뽑기 — 3단 계열 체감 상승 | 정책 반영 확인 |
| 전설 테스트 | `DefenseDemo.grantTestLegendariesAll()` | readme §개발용 |
