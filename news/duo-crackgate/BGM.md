# 배경음악 — ComfyUI로 만들기

페이지는 아래 두 파일을 자동으로 찾는다. 없으면 음악 없이 효과음만 재생되고 `음악 끄기` 버튼도 숨겨진다.

| 파일 | 쓰이는 구간 | 동작 |
| --- | --- | --- |
| `assets/bgm-calm.mp3` | 듀오가 펼쳐지는 0~2.5초 | 0.4초 페이드인 → **힌지가 갈라지는 순간 뚝 끊김** (정적 속에 '쩍'이 터지도록) |
| `assets/bgm-dark.mp3` | 로고가 갈라지는 장면부터 제목 화면까지 | 1.5초 페이드인, **반복 재생**, 기사로 스크롤하면 페이드아웃 |

음량은 `index.html`의 `BGM_VOL`(calm .55 / dark .45)에서 조절한다.

---

## 1. bgm-calm — 애플 키노트 같은 밝은 도입

곧바로 끊기므로 **첫 박부터 소리가 나야** 한다. 인트로 공백이 있으면 잘라낸다.

**ACE-Step (ComfyUI 템플릿: Audio → ACE-Step 텍스트→음악)**

- tags
  ```
  minimal, ambient, clean electronic, soft felt piano, airy synth pad, gentle pluck arpeggio, bright, optimistic, product launch, keynote, 100 bpm, major key, instrumental, no vocals
  ```
- lyrics: `[instrumental]`
- seconds: `10`
- KSampler: steps `50`, cfg `5`, sampler `euler`, scheduler `simple` (템플릿 기본값 유지)
- seed 여러 개 돌려서 **시작이 바로 밝게 들어오는 것**을 고른다

## 2. bgm-dark — 로고가 갈라지는 긴장

반복 재생되므로 **처음과 끝의 분위기가 같고, 멜로디가 튀지 않는** 것이 좋다.

- tags
  ```
  dark ambient, cinematic tension, low sub drone, deep bass pulse, slow heartbeat kick, distant metallic hits, sparse, ominous, documentary investigation, 70 bpm, minor key, instrumental, no vocals, no melody
  ```
- lyrics: `[instrumental]`
- seconds: `30`
- 나머지 설정 동일

### 대안: Stable Audio Open (짧은 질감·앰비언스는 이쪽이 더 안정적)

- calm: `Clean minimal ambient intro, soft piano and airy synth pad, bright and optimistic tech product reveal, 100 BPM`
- dark: `Dark cinematic drone, low sub bass pulse, slow heartbeat, distant metallic impacts, tense investigative documentary underscore, 70 BPM`
- negative: `vocals, drums fill, distortion, low quality`
- seconds: calm `10`, dark `30`

---

## 3. 다듬기 (ffmpeg)

ComfyUI 출력 파일(flac/mp3)을 받아 아래처럼 정리한 뒤 `assets/`에 넣는다.

```bash
# calm: 앞 공백 제거, 6초로 자르기, 음량 맞추기
ffmpeg -i calm_raw.flac -af "silenceremove=start_periods=1:start_threshold=-45dB,atrim=0:6,afade=t=in:d=0.05,loudnorm=I=-16:TP=-1.5" -ar 44100 -b:a 128k bgm-calm.mp3

# dark: 30초 중 끝 2초를 앞 2초와 겹쳐 이음매 없는 28초 루프로
ffmpeg -i dark_raw.flac -t 2 -i dark_raw.flac -filter_complex "[0]atrim=0:30[a];[a][1]acrossfade=d=2,atrim=start=2,asetpts=N/SR/TB,loudnorm=I=-18:TP=-1.5" -ar 44100 -b:a 128k bgm-dark.mp3
```

파일을 넣고 페이지를 열면 바로 적용된다. 코드 수정은 필요 없다.
