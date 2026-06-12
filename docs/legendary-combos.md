# 전설 조합 (관동 5종)



랜덤 뽑기에서 제외된 **144~146, 150~151** 은 보관함 재료를 모아 **전설 조합**으로만 획득합니다.  

설정 데이터: `js/pokemonConfig.js` → `LEGENDARY_COMBOS` · UI: `js/gameDemo.js`



---



## 조합표



| 결과 | No. | 역할 | 재료 (보관함, 각 1마리) | 컨셉 |

|------|-----|------|-------------------------|------|

| **프리져** | 144 | **단일** | **131** 라프라스 · **124** 냉룡 · **87** 덩구리(2단↑) | 얼음·물 |

| **썬더** | 145 | **범위** | **26** 라이츄(2단↑) · **125** 에레브 · **135** 쥬피썬더(2단↑) | 전기 |

| **파이어** | 146 | **범위** | **6** 리자몽(3단) · **38** 나인테일(2단↑) · **136** 부스터(2단↑) | 불꽃 |

| **뮤츠** | 150 | **단일** | **144** 프리져 · **145** 썬더 · **146** 파이어 | 삼새 합체 |

| **뮤** | 151 | **범위** | **150** 뮤츠 · **149** 망나뇽(3단) · **113** 낙지왕 | 최종 전설 |



- **role**: `pokemonConfig.js` `LEGENDARY_COMBOS[].role` → `getRoleForLegendaryId()`

- **minStage**: `0` = 해당 ID, `1` = 2단 이상, `2` = 3단(최종)

- 재료는 조합 시 **보관함에서 소모**

- 이미 보유(보관함·말판) 시 해당 레시피 **조합 불가**



### 전설 전투 규칙



| 항목 | 내용 |

|------|------|

| 역할 | **단일·범위만** — 슬로우·버프·유틸 강화(2합) **없음** |

| 등급 | 전설 배율 **1.16** (`POWER_TIER_MUL.legendary`) |

| 속성 | **단일** 전설만 8속성 부여 (프리져·뮤츠) |

| 진화 | 단일 라인 `[id]` — 추가 진화 없음 |



---



## 진행 순서 (권장)



```

[뽑기·합성] ──► 삼새 재료(144·145·146) ──► 삼새 조합

                      │

                      ▼

              [150 뮤츠] ──► [151 뮤] (망나뇽 3단 + 낙지왕)

```



1. 평소 뽑기·합성으로 전기/불/얼음·물·드래곤 라인 육성  

2. **프리져 → 썬더 → 파이어** (순서 무관, 뮤츠 전에 3종 필요)  

3. **뮤츠** 후 **망나뇽 3단(149)** + **낙지왕(113)** 으로 **뮤**



---



## UI



### 보관함 · 조합 패널



| 요소 | 설명 |

|------|------|

| **「전설 조합」** 버튼 | `gacha-toolbar` |

| **오버레이** | `#defense-demo > .legendary-overlay` — 맵 900×900, `z-index: 45` |

| **레시피 카드** | `.legendary-recipe` · 재료 충족 `.is-ready` · **보유 `.is-owned`** |

| **보유 표시** | 「보유」칩 · `보관함 보유` / `말판 배치 중` / `보관함·말판 보유` |

| **역할·속성** | 레시피 제목 옆 `role-badge` · 단일은 `element-badge` |

| **보관함 카드** | `.storage-card.is-legendary` · **「전설」** 금색 뱃지 |



### 말판 (Pixi · `uiLayer`)



| 요소 | 설명 |

|------|------|

| **역할 뱃지** | 우하단 — 일반과 동일 아이콘 + 전설 **금테·★** |

| **금색 링** | 발밑 — `drawLegendaryUnitAura` (`LEGENDARY_AURA_RADIUS` 24) |

| **레이어** | `getFieldUiLayer()` → `uiLayer` (스프라이트·버프 마스크 위) |

| **동기화** | `updateCombatAuras` 매 틱 위치 갱신 |



※ 오른쪽 **강화 패널**은 DOM — 말판 Pixi UI와 별도.



---



## 테스트 지급 (개발용)



```javascript

DefenseDemo.grantTestLegendariesAll();      // 없는 종만

DefenseDemo.grantTestLegendariesAll(true);  // 강제 1마리씩 추가

```



- 구현: `js/gameDemo.js` · 상세: [`readme.md`](../readme.md) §전설 5종 테스트 지급

- 지급 후 `syncLegendaryRoles()` · PNG `ensureStorageItemTexture`



---



## 맵 에셋



| 파일 | 크기 | 용도 |

|------|------|------|

| `assets/map-gym-field.png` | 900×900 | 체육관 배경 (Pixi) |

| 재생성 | `node scripts/generate-gym-map.js` | `canvas` npm 필요 |



---



## 테스트 · 검증



| 항목 | 방법 | 결과 |

|------|------|------|

| 조합 데이터 | `test-defense-logic.js` — `LEGENDARY_COMBOS` 5종 · `role` 필드 | 통과 |

| 공개 API | `grantTestLegendariesAll` in `gameDemo.js` | 통과 |

| UI 스모크 | `test-browser.mjs` — 전설 패널 | 통과 |

| 말판 UI | `grantTestLegendariesAll` → 배치 → 금링·뱃지 | 수동 확인 |

| 보유 표시 | 조합 패널 `.is-owned` | 수동 확인 |



---



## 변경 이력 (요약)



| 항목 | 내용 |

|------|------|

| 조합 5종 | `LEGENDARY_COMBOS` · 보관함 UI |

| 역할 | **단일/범위 고정** — 슬로우·버프 제거 |

| 말판 UI | `uiLayer` 뱃지·금링 · 텍스처 CDN 로드 |

| 조합 패널 | 보유 색·위치 문구 · 오버레이 z-index |

| 테스트 | `grantTestLegendariesAll()` |



---



## 관련 문서



- [`gen1-gacha-policy.md`](gen1-gacha-policy.md) — 뽑기 제외 5종  

- [`game-mechanics.md`](game-mechanics.md) — §11 전설 · §14~15  

- [`role-system.md`](role-system.md) — 전설·필드 UI  

- [`evolution-routes-gen1.md`](evolution-routes-gen1.md) — 재료 진화 루트

