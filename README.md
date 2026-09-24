# Metronome

振り子式のメトロノーム Web アプリ（PWA）。React + Vite + Tailwind CSS + Motion。

## 特徴

- **正確なリズム** — クリック音はすべて Web Audio API の時計上に予約して鳴らすため、JavaScript のタイマーの遅れに影響されません
- **振り子** — おもりを上下にドラッグしてテンポを変更（上ほど遅く、下ほど速い）。振り子は音と同じ時計で動き、クリックの瞬間に振り切ります
- タップテンポ、拍子（1〜7拍）、1拍目のアクセント
- PWA 対応：ホーム画面に追加、オフライン動作、演奏中は画面を消灯させない

## 操作

| キー | 動作 |
|---|---|
| Space | 再生 / 停止 |
| ↑ / ↓ | テンポ ±1（Shift で ±10） |
| T | タップテンポ |

## 開発

```sh
npm install
npm run dev      # http://localhost:5174
npm run build
```

`main` ブランチへの push で GitHub Actions が GitHub Pages に公開します（Settings → Pages → Source を「GitHub Actions」に設定）。

## クレジット

BPM 表示に [DSEG](https://www.keshikan.net/fonts.html) フォント（SIL Open Font License 1.1）を使用しています。
