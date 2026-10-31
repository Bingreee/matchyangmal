# 짝양말 (matchyangmal)

건조기에서 쏟아진 양말 더미에서 같은 짝을 찾아 연결하는 캐주얼 퍼즐 게임.
TypeScript + Phaser 4 + Vite.

## 설치와 실행

Node.js 20 이상이 필요합니다.

```bash
npm install      # 처음 한 번
npm run dev      # 개발 서버 실행 → http://localhost:5173
npm run build    # 배포용 빌드 (dist/ 폴더)
```

## 같은 와이파이에서 폰으로 테스트하기

1. PC와 폰을 같은 와이파이에 연결합니다.
2. `npm run dev` 를 실행하면 터미널에 주소가 두 줄 나옵니다.
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.0.12:5173/
   ```
3. 폰 브라우저(사파리/크롬)에서 **Network** 주소를 엽니다.
4. 안 열리면
   - Windows: 처음 실행 때 뜨는 방화벽 창에서 "개인 네트워크 허용"을 눌러 주세요.
     (놓쳤다면 Windows 보안 → 방화벽 → 앱 허용에서 Node.js를 허용)
   - macOS: "들어오는 연결 허용" 창이 뜨면 허용.
   - 회사/카페 와이파이는 기기끼리 연결을 막아 둔 경우가 있어요. 집 와이파이나 핫스팟으로 해 보세요.
5. 코드를 저장하면 폰 화면도 자동으로 새로고침됩니다.

## 폴더 구조

```
src/
  config.ts            조정할 수치 모음 (시간, 짝 수, 점수, 감점, 배치, 색)
  main.ts              Phaser 게임 시작, 세로 화면 스케일 설정
  logic/               게임 규칙 (Phaser와 무관한 순수 TypeScript)
    MatchGame.ts       매칭 판정, 점수, 콤보, 제한 시간, 별점
    stages.ts          스테이지 설정 계산, 누적 기록(런)
    sockDesign.ts      양말 무늬 데이터, 짝 생성, 섞기
  scenes/              화면
    TitleScene.ts      타이틀
    GameScene.ts       게임 (탭, 애니메이션, 정보창, 스테이지 클리어 창)
    ResultScene.ts     게임 오버 결과, 다시 하기
    keys.ts            씬 이름
  view/                그리기 도우미
    sockTexture.ts     양말을 코드로 그려 아틀라스로 굽기 (나중에 이미지로 교체)
    layout.ts          양말 더미 배치 (겹쳐 쌓기)
    ui.ts              버튼, 배경, 카드, 빨래 매트, 별점, 글꼴
    color.ts           색 밝기 조절
  audio/sfx.ts         효과음 ('뽁' 등, Web Audio로 합성)
  storage/SaveStore.ts 저장 (지금은 localStorage, 나중에 Supabase로 교체)
```

## 수치 조정

`src/config.ts` 만 고치면 됩니다.

- `stages`: 스테이지 표. 줄마다 짝 수(`pairs`), 제한 시간(`timeSec`), 쓰는 색 수(`colors`), 양말 크기(`scale`).
  `colors`가 `pairs`보다 적을수록 같은 색에 줄 개수만 다른 양말이 섞여 어려워집니다.
- `endless`: 마지막 스테이지 이후 스테이지마다 줄어드는 시간
- `layout.minDistance`: 양말끼리 겹치는 정도 (작을수록 많이 겹침)
- `wrongPenaltySec`, `comboWindowMs`, `comboBonusPerStep`, `stars`: 감점, 콤보, 별점 기준
