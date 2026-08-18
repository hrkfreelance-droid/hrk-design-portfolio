# HRK DESIGN PORTFOLIO — Full Rebuild

## 目的

既存Adobe Portfolioサイト：

https://hrkdesign.myportfolio.com/

を素材元として解析し、掲載されている作品画像を可能な限りすべてローカルへ保存した上で、完全に新しいポートフォリオサイトを制作してください。

既存サイトのデザインをコピーするのではなく、

- 作品画像
- 作品ページ
- カテゴリ構成
- 取得可能なタイトル・クライアント情報

のみを資産として引き継ぎ、デザインはゼロから再構築してください。

最終イメージは、

**Minimal / Modern / Typography / Art Direction / Editorial / Motion**

です。

白背景＋黒文字を基本に、Helvetica系の強いタイポグラフィと大きな余白、作品そのものを主役にした、デザイナー向けのかなり洗練されたポートフォリオにしてください。

---

# 0. 最重要ルール

既存ファイルや素材を勝手に削除・上書きしないでください。

新規プロジェクトフォルダを作成して、その中だけで作業してください。

元サイトから取得した画像は一切再生成しないでください。

作品画像内の、

- ロゴ
- 文字
- 商品
- 写真
- レイアウト
- 色
- クライアント表記

をAIで変更・再生成しないでください。

取得できなかった画像を類似画像やAI生成画像で代用しないでください。

不明な情報は推測せず `unknown` としてください。

GitHubへのpush、Netlify等へのdeploy、外部公開はまだ行わないでください。

---

# 1. 最初に既存サイトを完全調査

まず制作を始めず、

https://hrkdesign.myportfolio.com/

を調査してください。

確認するもの：

- TOPページ
- 全ナビゲーション
- 全カテゴリ
- 全作品ページ
- 全作品タイトル
- 全画像
- alt
- caption
- Adobe Portfolio側の画像URL
- srcset
- project URL
- category
- ページ内テキスト
- クライアント名として利用できそうな情報
- 制作物の種類

を取得してください。

Adobe Portfolioで通常HTML取得だけでは十分な情報が取れない場合は、必要に応じてブラウザ/Playwright等を使用して実ページを確認してください。

単純なHTTP取得がブロックされた場合、それだけでサイトが存在しないと判断しないでください。

---

# 2. 全画像をダウンロード

既存Portfolioに掲載されている作品画像を可能な限りすべて取得してください。

Adobe CDN等で `srcset` が存在する場合は、原則として取得可能な中で最大解像度の実画像を選んでください。

ただし無意味なアップスケールは行わないでください。

保存先例：

assets/
  portfolio/
    project-name/
      001.jpg
      002.jpg
      003.jpg

サムネイルだけでなく、各作品詳細ページ内の画像も確認してください。

以下は作品画像として扱わないでください。

- ブラウザUI
- Adobe Portfolio共通UI
- 不要なアイコン
- tracking pixel
- spacer
- 極小サムネイル
- 重複画像

同じ画像が複数URLで存在する場合はhash等で重複確認してください。

---

# 3. 素材Manifestを作る

ダウンロード後、

data/portfolio.json

等に作品情報を整理してください。

各作品について最低限、

- id
- title
- client
- type
- category
- originalProjectUrl
- images
- sourceImageUrls

を管理してください。

クライアント名や制作種類の判断優先順位：

1. 元ページの正式テキスト
2. title / caption / alt
3. filename
4. 画像そのものを確認
5. 上記で判断できなければ unknown

画像だけから推測して正式クライアント名を捏造しないでください。

例えば明確に、

Machida Shoten
MATCHA TIMES
CIJD

等が確認できた場合のみ採用してください。

制作種類も、

Flyer
Poster
Menu
Web Design
Branding
Logo
Signage
SNS
Advertising
Package

など、実際の作品から判断してください。

---

# 4. カテゴリ

新しいPortfolioでも、

**既存Portfolioと同じカテゴリ構造**

を基本として使用してください。

カテゴリ名を勝手に変更する前に元サイトを調査してください。

ただしUIそのものは完全に新しくしてください。

カテゴリは作品一覧上部に非常にシンプルなフィルターとして表示します。

例：

ALL
GRAPHIC
WEB
BRANDING
...

実際の文言は元サイト調査後に決定してください。

---

# 5. サイトの基本原稿

ブランド名：

hrk_design

名前：

hiroki toyoshima

表記は原則すべてlowercaseを基調として構いません。

メインビジュアルでは巨大な文字で、

hrk_design

を使用してください。

補助として、

hiroki toyoshima

を配置してください。

文章を増やしすぎないでください。

ポートフォリオなので説明より作品とタイポグラフィを優先します。

---

# 6. デザインコンセプト

方向性：

- minimal
- simple modern
- Swiss / International Typography
- editorial
- contemporary art gallery
- typography-driven
- monochrome
- art direction
- fashion / architecture portfolio的な静けさ
- 大胆だがうるさくない
- 高級感
- 大きな余白

基本：

Light Mode

Background:
#FFFFFF

Text:
#000000

Dark Mode

Background:
#000000

Text:
#FFFFFF

アクセントカラーは基本使用しないでください。

作品画像の色だけが画面の色になる設計が理想です。

---

# 7. Typography

Helvetica系を使用してください。

優先：

Helvetica Neue
Helvetica
Arial
sans-serif

Helveticaのフォントファイルを勝手にダウンロード・同梱しないでください。

macOS等でHelveticaが利用できる場合はsystem fontとして使用します。

特徴：

- 巨大なdisplay typography
- 小さなmetadata
- 強いサイズ差
- 大胆な余白
- 細い罫線
- uppercase / lowercaseの使い分け
- letter spacingを丁寧に調整

「全部同じサイズのWebサイト」にしないでください。

---

# 8. Hero

最初の画面は作品一覧をすぐ見せるのではなく、強いタイポグラフィで始めます。

例：

hrk_design

をviewportに対して非常に大きく表示。

その近くに小さく、

hiroki toyoshima
graphic / digital / web
phnom penh

程度。

ただし説明文を大量に置かないでください。

スクロール開始時に巨大な `hrk_design` が少し分解・移動・縮小するなど、タイポグラフィを使ったアート的motionを入れてください。

---

# 9. Motion Design

このサイトでかなり重要です。

ただし「Webテンプレートっぽい派手なanimation」にはしないでください。

使ってよい方向：

- kinetic typography
- scroll-linked typography
- smooth reveal
- clip-path reveal
- image mask transition
- subtle parallax
- oversized text movement
- horizontal typography movement
- project image hover
- cursor interaction
- page transition
- subtle image scale
- stagger reveal

動きは静かで上品にしてください。

「かっこいい＝全部動く」にはしないでください。

基本画面は静かで、操作した瞬間だけアート的な動きが現れる設計にしてください。

必要であればGSAP等を使用して構いません。

60fpsを目標とし、

- layout thrashing
- 不要な巨大JS
- 過剰なblur
- 過剰なWebGL

は避けてください。

`prefers-reduced-motion` にも対応してください。

---

# 10. WORK一覧

作品を非常に大きく見せてください。

カードUIを大量に並べる普通のPortfolioにはしないでください。

作品画像そのものをレイアウトの中心にします。

Desktopでは、

- 大きい画像
- 小さい画像
- 横長
- 縦長

が自然に混ざるeditorial gridも検討してください。

ただしPinterestのような雑然としたMasonryにはしないでください。

構成にリズムを作ってください。

---

# 11. 作品情報

ユーザーが希望している重要ポイントです。

各作品画像の横または下に、

**クライアント名**
**制作物の種類**

を「めちゃくちゃ小さく」添えてください。

例：

MATCHA TIMES
FLYER

または、

MATCHA TIMES / FLYER

表示サイズ目安：

9px〜11px程度

Desktopではかなり小さくて構いません。

ただし読めないレベルにはしないでください。

letter spacingを少し広くして、ギャラリーの作品番号や美術館キャプションのように扱ってください。

タイトルを巨大表示する必要はありません。

作品画像が主役です。

---

# 12. Project Detail

作品クリック後は各作品ページを開いてください。

Project pageは、

巨大作品画像
↓
次の画像
↓
次の画像

という非常にシンプルな構成を基本としてください。

上部または左端に小さく、

Client
Type
Category
Year（確認できた場合のみ）

を表示。

情報がない項目を捏造しないでください。

最後に、

NEXT PROJECT →

等で次作品へ移動できるようにしてください。

---

# 13. About / CIJD

CIJDへのリンク：

https://www.facebook.com/cijdco

表記：

CIJD Co., Ltd.

提供されている情報：

“We are Japanese IT and any service company.”

この文章をそのままメインコピーとして使うのではなく、自然な英語に整えてください。

現段階では以下程度の短いコピーを仮採用して構いません。

CIJD Co., Ltd. is a Japanese IT and service company working across digital, design, web, and practical business support.

We connect ideas, technology and execution with a flexible, hands-on approach.

ただし、これは正式会社説明ではなくPortfolio用の簡潔な紹介として扱ってください。

事実確認できていない具体的な、

- 拠点数
- 社員数
- 設立年
- 実績数
- 有名企業との取引
- 国際展開

等を勝手に追加しないでください。

CIJD部分も大量の文章は不要です。

---

# 14. Contact

Contactは非常にシンプルにしてください。

表示：

CONTACT

Telegram

@hiroki_pp

Telegram URL：

https://t.me/hiroki_pp

クリックでTelegramを開けるようにしてください。

さらにTelegram URLのQRコードを表示してください。

QRコードは第三者のQR画像生成サービスへ依存せず、可能ならローカルで生成してください。

QR内容：

https://t.me/hiroki_pp

QRは白黒のみ。

装飾しすぎず、確実に読み取れるquiet zoneを確保してください。

---

# 15. Dark Mode

Dark Modeを必ず搭載してください。

Light:
white / black

Dark:
black / white

作品画像自体にはfilterをかけないでください。

設定優先順位：

1. ユーザーが選択したテーマ
2. localStorage
3. OS `prefers-color-scheme`

小さくシンプルなtoggleをheaderへ配置。

巨大なsun/moon iconなどは不要です。

例えば：

LIGHT / DARK

または非常に小さい○アイコン程度。

---

# 16. Header

Headerは固定または必要に応じて追従。

例：

hrk_design

WORK
ABOUT
CONTACT

LIGHT / DARK

できるだけ文字だけで構成してください。

スマホでも巨大なハンバーガーメニューを使うより、可能なら簡潔なnavigationを維持してください。

---

# 17. Cursor

Desktopのみ、必要であれば独自cursor interactionを実装して構いません。

作品hover：

VIEW

など。

ただしOSカーソルを完全に消して操作性を悪化させないでください。

Mobileでは無効。

---

# 18. Responsive

必ず確認：

375px
390px
430px
768px
1024px
1440px以上

特に390px前後のスマートフォンを重視してください。

Desktop版の縮小コピーではなく、スマホでも余白・文字サイズ・作品順序をきちんと再設計してください。

---

# 19. 技術構成

静的Portfolioとして軽量にしてください。

基本候補：

Vite
HTML
CSS
JavaScript

React等が明確に必要でなければ、無理に巨大frameworkを使わなくても構いません。

依存ライブラリも最小限にしてください。

Motion用途でGSAP等を採用する場合は、その理由を明確にしてください。

画像はlazy loadingを利用。

CLSを防ぐためwidth / heightまたはaspect-ratioを設定。

画像を必要以上に再圧縮しないでください。

元ファイルは保存したまま、Web表示用optimized copyを別途作る方式で構いません。

---

# 20. SEO / 基本情報

title例：

hrk_design — Hiroki Toyoshima

description例：

Portfolio of Hiroki Toyoshima / hrk_design.

Open Graphの最低限の設定をしてください。

faviconも文字ベースでシンプルに作成して構いません。

作品画像をfavicon化しないでください。

---

# 21. Accessibility

最低限、

- semantic HTML
- keyboard navigation
- alt
- focus state
- sufficient contrast
- reduced motion

に対応してください。

デザインを壊すような過剰なアクセシビリティUIは不要です。

---

# 22. 作業順序

必ず以下の順番で進めてください。

## Phase 1 — Research

元Portfolioを調査。

カテゴリ・作品ページ・画像数を確認。

## Phase 2 — Download

作品画像をすべて保存。

取得できなかったページや画像を一覧化。

## Phase 3 — Manifest

portfolio.jsonを作成。

client / type / category等を整理。

## Phase 4 — Design

サイト構造とデザインシステムを決める。

## Phase 5 — Build

実装。

## Phase 6 — Motion

静的レイアウト完成後にmotionを追加。

## Phase 7 — QA

レスポンシブ・画像・リンク・Dark Mode・motionを確認。

---

# 23. Visual QA

Playwright等が使用可能なら実ブラウザで表示してください。

最低限、

390 × 844
1440 × 1000

でスクリーンショット確認してください。

チェック：

- 画像切れ
- 画像比率
- overflow
- typo
- 小さすぎるmetadata
- 巨大文字のはみ出し
- Dark Mode
- QR読み取り
- Telegramリンク
- category filter
- project navigation
- animation
- reduced motion
- mobile menu
- footer

を確認してください。

---

# 24. 特に避けること

以下のようなサイトにはしないでください。

- SaaS LP
- AIスタートアップLP
- Bootstrap template
- 丸角カードだらけ
- gradientだらけ
- glassmorphism
- neon
- purple gradient
- iconだらけ
- buttonだらけ
- heroに意味不明な3Dオブジェクト
- stock photo
- AI生成画像
- 不要なtestimonial
- 数字の実績カウンター
- CLIENTSロゴを勝手に生成
- 過剰な自己紹介
- 長文About

Apple風プロダクトサイトにも寄せすぎないでください。

あくまで、

**graphic designer / art directorのPortfolio**

として成立させてください。

---

# 25. デザイン判断基準

迷った場合は、

「足す」より「削る」。

装飾よりタイポグラフィ。

UIより作品。

説明より余白。

AnimationよりTiming。

色より画像。

を優先してください。

一見シンプルだが、スクロールすると細かいタイポグラフィとモーションの設計が非常に凝っているサイトを目標にしてください。

---

# 26. 完了時の報告

最後に必ず以下を報告してください。

## Source Audit
- 発見したカテゴリ
- 発見した作品数
- 発見した画像数
- ダウンロード成功数
- ダウンロード失敗数

## Created
作成した主要ファイル。

## Asset Structure
画像保存構成。

## Design
実装したデザイン概要。

## Motion
実装したmotion一覧。

## Verification
- build
- desktop
- mobile
- light mode
- dark mode
- QR
- Telegram link
- project pages
- category filtering

をそれぞれ成功/失敗で明記。

## Unknown
判断できなかったクライアント名・制作種類・カテゴリ。

## Important
まだGitHub push / deploy / 外部公開は行わないでください。

ローカルで完成状態まで作成し、確認用URLまたはローカル起動方法とスクリーンショットを提示したところで停止してください。