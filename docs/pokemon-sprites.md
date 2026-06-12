# 포켓몬 스프라이트 가이드 (요약)

[PokeAPI/sprites](https://github.com/PokeAPI/sprites) CDN 기준. **전 종 ID 일괄 스캔은 하지 않음** — 뽑기·구현에 필요한 범위만 정리.

---

## 1. GIF로 공격 모션?

**별도 「공격 전용 GIF」는 거의 없음.**

| 종류 | 경로 | 내용 |
|------|------|------|
| **Gen5 B&W animated** | `.../generation-v/black-white/animated/{id}.gif` | **대기/흔들림 루프** (BW 게임 스타일). 공격 프레임 분리 X |
| **Showdown** | `.../other/showdown/{id}.gif` | 배틀용. 종마다 유무·크기 들쭉날쭉 |
| **Crystal animated** | `.../generation-ii/crystal/animated/{id}.gif` | 1~251 위주, 작은 루프 |

**실무 추천**

- 뽑기·필드: **PNG** (가볍고 1~1025 안정)
- 공격 시: Gen5 **GIF 1회 재생** 또는 PNG + 이펙트 (빔/플래시)
- GIF 뽑기 풀: **Gen5 animated 있는 ID만** (아래 §3)

---

## 2. URL 패턴

베이스: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon`

```
# 기본 앞모습 PNG (뽑기·적 기본)
{pokemon}/{id}.png
예: .../pokemon/25.png

# Gen5 PNG (96px, 필드용 대안)
{pokemon}/versions/generation-v/black-white/{id}.png

# Gen5 GIF (루프, 공격 연출 후보)
{pokemon}/versions/generation-v/black-white/animated/{id}.gif
```

미러: `https://pokeapi.github.io/sprites/sprites/pokemon/...` (경로 동일)

---

## 3. 대략적인 개수 (ID 1~1025, HEAD 샘플 기준)

| 구분 | 대략 | 비고 |
|------|------|------|
| **기본 PNG** | **1025종** | `{id}.png` — 뽑기 풀 넉넉 |
| **Gen5 animated GIF** | **약 780종** | PNG+GIF 둘 다 있는 경우가 대부분 |
| **PNG만 (GIF 없음)** | **약 245종** | **650번대 일부**부터 많음. 상위 세대 일부는 GIF 다시 있음 (예: 898 확인됨) |

→ **GIF만 쓰는 뽑기**면 780풀. **PNG 폴백**이면 1~1025 전부 가능.

정확한 ID 목록이 필요하면 나중에 `scripts/check-sprites.js`로 100개 단위만 돌리면 됨 (전수 2000+ 요청은 불필요).

---

## 4. 게임에서의 사용

| 용도 | ID 범위 | 함수 / 경로 |
|------|---------|-------------|
| **뽑기** | 관동 1~151, 1단만 | `randomGachaLine()` → `line[0]` · [`gen1-gacha-policy.md`](gen1-gacha-policy.md) |
| **일반 적** | 1~1025 | `randomId()` |
| **보스** | 전설 풀 순환 | `getBossIdForRound()` · [`game-mechanics.md`](game-mechanics.md) §3 |
| **공격 연출** | Gen5 GIF 또는 PNG 플래시 | `loadAttackSprite()` |

- 뽑기 결과 → **보관함** (자동 말판 배치 없음) · 드래그·일괄배치로 10×10 그리드 배치
- [게임 START] 후 ROUND·웨이브 진행 (클리어 후 2.8초 대기, **1분 타이머 +3장**)

---

## 5. Pixi v7 메모

- GIF: `PIXI.Assets.load(gifUrl)` → `PIXI.AnimatedSprite.fromFrames(...)` 또는 텍스처 시퀀스
- PNG: 기존 `Sprite`와 동일
- CDN 실패 시: 회색 placeholder + 재시도 1회

---

## 6. 참고

- [sprites README](https://github.com/PokeAPI/sprites/blob/master/README.md)
- 650+ 스프라이트: Smogon 커뮤니티 제작 (공식 BW 아님)
- 게임 규칙: [`game-mechanics.md`](game-mechanics.md) · 역할: [`role-system.md`](role-system.md) · 전설: [`legendary-combos.md`](legendary-combos.md)
- 전설·보관함 배치 시 `loadPokemonTexture` / `ensureStorageItemTexture` 로 CDN PNG 로드
- 변경·테스트: `game-mechanics.md` §14~15 · 테스트 지급: `readme.md` §전설 5종 테스트 지급
