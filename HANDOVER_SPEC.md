# SMART LIFE AO 房総校 サークルスケジュール 運用・引継仕様書

最終更新: 2026-07-02
対象リポジトリ: https://github.com/smartlife-ao-boso/slao
現行バックアップコミット: b864170
現行バックアップブランチ: backup/after-contact-details-20260702-134935
ローカルtarバックアップ: /tmp/slao_b864170_20260702_134935.tar

## 1. システム概要

SMART LIFE AO 房総校のサークル・入校説明会スケジュールを表示、管理する静的Webアプリです。

主な画面は2つです。

- index.html: 管理画面。イベント表示、管理者ログイン、イベント編集、予約入力、実績入力、資料アップロードを扱います。
- customer.html: 顧客向け閲覧画面。イベント一覧、カレンダー、会場フィルタ、会場連絡先表示を扱います。

本番データはGoogle Apps Script、以下GAS、をバックエンドとして取得・保存します。events.json は本番データソースではありません。

## 2. 現行構成

### 2.1 リポジトリ内ファイル

- index.html
  - 管理者向け画面です。
  - GASからイベントを読み込みます。
  - 管理者ログイン後、イベント追加・編集・削除を行い、GASへ保存します。
  - 予約、実績、資料アップロードもGASへ送信します。
- customer.html
  - 一般閲覧用画面です。
  - GASからイベントを読み込みます。
  - カレンダー表示、リスト表示、会場フィルタ、イベント詳細モーダルを提供します。
- events.json
  - 旧または初期確認用の静的イベントデータです。
  - 現行本番運用では使用しません。

### 2.2 現行GAS URL

index.html と customer.html の両方に同じURLを設定しています。

```js
const BOSO_GAS_URL = 'https://script.google.com/macros/s/AKfycby8cECPGXC7855kG4Fvqk65RnMz9yPeE8jj3bCxuGLplMIWW0AhdIM2ZCjNPzTXeqFL/exec';
```

GASを再デプロイした場合は、index.html と customer.html の両方を同じURLへ更新してください。

## 3. データソースと通信仕様

### 3.1 イベント取得

両画面とも以下のGETでイベント一覧を取得します。

```text
GET {BOSO_GAS_URL}?action=events
```

レスポンスは以下のどちらかに対応しています。

```json
{"status":"success","events":[...]}
```

または

```json
[...]
```

イベント1件の主なフィールドは以下です。

| フィールド | 内容 | 例 |
|---|---|---|
| date | 開催日。YYYY-MM-DD | 2026-07-12 |
| time | 開始時刻。HH:mm | 13:00 |
| venue | 会場名 | 市原、君津、木更津、茂原、市原五井、おゆみ野、東金 |
| circle | サークル名 | 暮らしのデジタル安全講習 |
| title | 講座タイトル | 入校説明会：データのバックアップ／Free Wi-Fiって安全なの？ |
| member | 対象、定員、条件 | AO校生・10組 |
| folder | 資料格納用フォルダ名 | 2026-07-12_入校説明会_市原 |
| type | 種別。セミナーは seminar | seminar |

### 3.2 イベント保存

管理画面で編集したイベントは以下のPOSTでGASへ送信します。

```json
{
  "action": "saveEvents",
  "events": [ ... ]
}
```

index.html では `mode: 'no-cors'` で送信しています。ブラウザから直接サーバー上のファイルを書き換える設計ではありません。

### 3.3 予約・実績・資料アップロード

管理画面のイベント詳細から以下のアクションをGASへ送信します。

| action | 用途 |
|---|---|
| reserveAdd | 予約登録 |
| reportAdd | 実績登録 |
| uploadPresentation | プレゼン資料アップロード |
| uploadedFile | アップロード済み資料URL取得 |
| adminEditRow | 予約・実績行の修正 |
| adminDeleteRow | 予約・実績行の削除 |

## 4. GAS側の想定仕様

現行のGASは、房総専用バックエンドとしてイベント、予約、実績、資料アップロードを1本で扱います。

想定スプレッドシート名:

```text
SMART_LIFE_AO_BOSO_ADMIN_DATA
```

想定シート:

| シート名 | 用途 | 主な列 |
|---|---|---|
| EVENTS | イベント一覧 | date, time, venue, circle, title, member, folder, type |
| RESERVES | 予約データ | timestamp, groupCount, participantCount, asset, eventName, note, plannerName |
| REPORTS | 実績データ | timestamp, eventName, groupCount, participantCount, vcCount, assetCount, pcCount, iphoneCount, otherCount, issues, measures, instructor, plannerCount, plannerCost, otherCost |
| UPLOADS | 資料アップロード履歴 | timestamp, folderName, eventDate, eventVenue, eventTitle, fileName, url, fileId |

別GASへ移設する場合は、上記のレスポンス形式とaction名を維持してください。

## 5. 管理者認証

管理画面のログインは index.html 内のクライアント側ハッシュ照合です。

- ソルト: `slmc-boso-admin-v1`
- ハッシュ定数: `ADMIN_PASS_HASH`

重要: これは簡易認証です。URLを知っている人に対する軽い編集防止であり、強固な権限管理ではありません。厳密な運用にする場合は、GAS側で認証・認可を実装してください。

## 6. 会場仕様

現在の会場は以下です。

| venue値 | 表示名 | 店舗名 | 住所 | 電話 |
|---|---|---|---|---|
| 市原 | 市原キャンパス | ピーシーデポスマートライフ市原インターBASE | 〒290-0050 千葉県市原市更級3丁目1番地1 | 0436-20-6511 |
| 君津 | 君津 | パソコンクリニック ケーズデンキ 君津店内店 | 〒299-1151 千葉県君津市中野4丁目11番7号 | 0439-50-0371 |
| 木更津 | 木更津 | パソコンクリニック ケーズデンキ 木更津店内店 | 〒292-0038 千葉県木更津市ほたる野4丁目3番3 | 0438-30-5185 |
| 茂原 | 茂原 | ピーシーデポスマートライフ 茂原 Club Lounge | 〒297-0023 千葉県茂原市千代田町1-3-12 | 0475-20-5621 |
| 市原五井 | 市原五井 | パソコンクリニック ケーズデンキ 市原五井店内店 | 〒290-0050 千葉県市原市更級4丁目1番地1 | 0436-20-1501 |
| おゆみ野 | おゆみ野 | パソコンクリニック ケーズデンキ おゆみ野店内店 | 〒266-0032 千葉県千葉市緑区おゆみ野中央9丁目19番 | 043-300-5191 |
| 東金 | 東金 | ピーシーデポスマートライフ東金Club Lounge | 〒283-0001 千葉県東金市家之子483-1 | 0475-86-7390 |

### 6.1 会場追加時に変更する箇所

index.html:

- 画面上部の会場表示、凡例
- `venueClass(v)`
- `venueIcon(v)`
- 管理編集モーダルの `<select id="editVenue">`

customer.html:

- 会場フィルタボタン
- フッターの会場カード
- `venueClass(v)`
- `venueIcon(v)`
- `venueColor(v)`
- カレンダー凡例
- `campusInfo`

注意: venue値はイベントデータの `venue` と完全一致させてください。例として `市原五井` は `市原` を含むため、判定関数では `市原五井` を `市原` より先に判定しています。

## 7. サーバー移設手順

### 7.1 静的サイトだけ移設する場合

既存GASを継続利用するなら、静的ファイルを任意のWebサーバーへ配置するだけで動作します。

必要ファイル:

- index.html
- customer.html
- events.json、任意。現行本番では未使用

配置例:

```text
/var/www/slao/index.html
/var/www/slao/customer.html
/var/www/slao/events.json
```

Webサーバー要件:

- HTTPS推奨
- 静的HTML、CSS、JavaScriptを配信できること
- Google Fonts、Google Analytics、GAS URLへの外部アクセスをブロックしないこと

### 7.2 GitHub Pages等で運用する場合

- mainブランチを公開対象に設定します。
- ルートディレクトリ配信で問題ありません。
- customer.html を一般向けURLとして案内します。
- index.html は管理者向けURLとして扱います。

### 7.3 GASも移設する場合

1. 新しいGoogleスプレッドシートを作成します。
2. GASプロジェクトを作成し、現行GASと同じaction仕様を実装します。
3. EVENTS, RESERVES, REPORTS, UPLOADS のシートを作成します。
4. Driveアップロード用フォルダを作成し、GASから書き込み可能にします。
5. ウェブアプリとしてデプロイします。
   - 実行ユーザー: 自分
   - アクセスできるユーザー: 全員、または運用要件に合わせる
6. 発行URLを index.html と customer.html の `BOSO_GAS_URL` に設定します。
7. customer.html でイベント取得、index.html でイベント保存、予約、実績、資料アップロードをテストします。

## 8. 通常運用手順

### 8.1 イベントを追加する

1. index.html を開きます。
2. 管理者ログインします。
3. 「追加」を押します。
4. 日付、時間、会場、サークル名、タイトル、対象を入力します。
5. 保存します。
6. 必要に応じて「GASへ保存」を押します。
7. customer.html で表示を確認します。

### 8.2 イベントを修正する

1. index.html で管理者ログインします。
2. イベント一覧から対象イベントを選択します。
3. 内容を修正して保存します。
4. customer.html で反映を確認します。

### 8.3 予約・実績を確認する

1. index.html のイベントをクリックします。
2. 予約または実績の表示・入力欄を確認します。
3. 必要に応じて「予約・実績を修正する」から行単位で修正します。

### 8.4 資料をアップロードする

1. index.html のイベント詳細を開きます。
2. 「プレゼン資料をアップロード」からファイルを選びます。
3. GASがDriveへ保存し、UPLOADSへ履歴を書き込みます。

## 9. バックアップと復旧

### 9.1 現行バックアップ

この仕様書作成時点のバックアップは以下です。

- GitHubブランチ: `backup/after-contact-details-20260702-134935`
- コミット: `b864170`
- ローカルtar: `/tmp/slao_b864170_20260702_134935.tar`

### 9.2 復旧方法

GitHub上でmainをバックアップへ戻す例:

```bash
git fetch origin
git checkout main
git reset --hard origin/backup/after-contact-details-20260702-134935
git push --force-with-lease origin main
```

注意: `reset --hard` と force push は破壊的操作です。実行前に現行mainを別ブランチへ退避してください。

ローカルtarから復元する例:

```bash
mkdir -p /tmp/slao_restore
tar -xf /tmp/slao_b864170_20260702_134935.tar -C /tmp/slao_restore
```

## 10. デプロイ前チェックリスト

- index.html と customer.html の `BOSO_GAS_URL` が同じである
- customer.html でイベント一覧が読み込める
- index.html で管理者ログインできる
- イベント追加、編集、削除がGASへ保存される
- 会場フィルタが期待どおり動く
- イベント詳細モーダルに電話番号、店舗名、住所が表示される
- 予約登録がRESERVESへ入る
- 実績登録がREPORTSへ入る
- 資料アップロードがDriveとUPLOADSへ反映される
- スマホ幅で表示崩れがない

## 11. 運用上の注意

- events.json を本番データソースとして復活させないでください。
- localStorage保存方式へ戻さないでください。
- 北総用GAS URLや旧スプレッドシートIDを混ぜないでください。
- GAS URLを差し替える場合は index.html と customer.html の両方を更新してください。
- 会場名を変更する場合、既存イベントの venue 値、フィルタ、色分け、campusInfo を合わせて更新してください。
- 管理者パスワードを変更する場合、`ADMIN_SALT + 新パスワード` のSHA-256を計算し、`ADMIN_PASS_HASH` を更新してください。

## 12. 後任向けの最短把握ポイント

- このリポジトリは静的フロントエンドです。
- 本番イベントデータはGASとスプレッドシートにあります。
- 表示だけを直すなら customer.html と index.html を編集します。
- イベントデータそのものを直すなら管理画面、またはGAS連携先のEVENTSシートを確認します。
- 移設時に最も重要なのは `BOSO_GAS_URL` とGASのaction互換性です。
