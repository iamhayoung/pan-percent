# Polish Backlog

実機反復で後からまとめて対応する「磨き込み（visual / UX polish）」項目の一覧。

- 機能バグはここに溜めず即対応する。ここは見た目・体験の調整用。
- 各項目に「発見時の文脈」を残す。対応したらチェックして簡単な結果を添える。
- spec の「配色・レイアウトは実機で触りながら反復前提」を運用する場所。

## Navigation / Header

- [ ] **レシピ詳細画面のヘッダーが、タブ画面（レシピ/設定）より少し低い。**
  - 原因: タブのヘッダーは Tabs ナビゲーター、詳細画面のヘッダーはルートの Stack ナビゲーターが描画しており、既定のヘッダー高さ/タイトルの出方が異なるため。
  - 環境: iOS / Android 両方、ライト / ダーク両方で発生（＝色ではなくナビ構造差）。
  - 方針: ナビ仕上げ段階（Liquid Glass をナビ面に乗せる検討含む, spec §8）で、ヘッダーの見せ方（高さ統一・large title 採否・背景）をまとめて統一する際に対応。
  - 発見: `feature/recipe-list-detail` 実機確認時。

- [ ] **iOS 26+ で詳細画面のヘッダーが、リスト/設定の ScreenHeader と完全に揃わない。**
  - 原因: iOS 26 から Liquid Glass UI で戻るボタンが丸く大きくなり、Stack の navigation bar 全体が高くなる。`ScreenHeader` 側は `BAR_HEIGHT = iosMajorVersion() >= 26 ? 60 : 44` で揃えているが、`60` は推定値。
  - 環境: iOS 26+ のみ。Android では既に揃っている。
  - 方針: 実機で見たままの差分を計測し、`ScreenHeader` の `BAR_HEIGHT` を微調整。あるいは `useHeaderHeight()` 系の動的取得に切替（Tabs 内では取得不可なので別策が必要）。
  - 発見: `feature/recipe-form` 実機確認時。

## Keyboard / Forms

- [ ] **タグ編集 UI で「+ Add tag」ボタンと入力欄の幅が OS で揃わない。**
  - 症状: タップして TextInput に切り替えると、iOS では TextInput の方が少し長く、Android では少し短い。
  - 環境: iOS / Android で挙動が逆方向。表示・操作上は問題なし。
  - 試したこと: minWidth 調整、onLayout でボタンの実測 width を TextInput に渡す方法、親 Pressable で囲んで中身だけ切り替える構造 — どれも完全には揃わなかった。React Native の TextInput が OS ごとに intrinsic padding / measure を持つことが原因。
  - 方針: 一旦現状維持。改善方向は、外側を完全に同一の View でラップしつつ TextInput の native intrinsic padding を相殺する実装か、外側に width を固定で持たせる方向。
  - 発見: `feature/tag-chips` 実機確認時。

- [ ] **iOS で leave-guard の Cancel 後に戻るボタンが反応しなくなる。**
  - 症状: 編集画面で変更あり → `<` → 「Save changes?」alert → Cancel → 編集画面に戻る → `<` をもう一度タップしても無反応。スワイプ back するとリスト方向に動くが、一瞬で alert が再表示される。
  - 環境: iOS のみ（Android では問題なし）。Save / Discard / Delete 経路は正常。
  - 仮説: `usePreventRemove` + iOS native-stack の組み合わせで、preventDefault した back イベントの状態が pop されず、次の back タップが内部で抑制される。
  - 試したこと: alert の Cancel button に明示的な `onPress: () => {}` を追加 → 効果なし。
  - 方針: React Navigation 側の挙動を要調査。代替として `dispatch(NavigationActions.preventDefault(false))` の手動解除や、`pop()` を Cancel で明示的に呼ばず別のフックで管理する案。今は致命的ではない（Save / Discard / Delete / スワイプ back は機能）ため後回し。
  - 発見: `feature/recipe-form` 実機確認時。

- [ ] **Android で入力欄が出現したキーボードに隠れたまま動かない。**
  - 原因: Expo の edge-to-edge UI と `softwareKeyboardLayoutMode` の組み合わせで `adjustResize`/`adjustPan` が効かない。`KeyboardAvoidingView` の `behavior="height"` を入れるとキーボード消滅後の safe area 計算が壊れる（focus 外したあと indicator bar と save bar が被る）副作用が出た。
  - 環境: Android（Expo Go）。iOS は `automaticallyAdjustKeyboardInsets` + `KeyboardAvoidingView (padding, offset 56)` で動作している。
  - 方針: dev client セットアップ後に `react-native-keyboard-controller` の `KeyboardAwareScrollView` を導入する。Expo Go では native module を含まないため動かない。
  - 発見: `feature/recipe-form` 実機確認時。

## Color / Branding

- [ ] **ブランドカラー（アクセント1色）を詰める専用パス。**
  - 方針: ブラウン/ベージュ基調は維持（カテゴリ適合・パンらしさ）。差別化は「こだわったアクセント1色＋大きく読みやすいUI＋ベーカー% の体験」で出す（色の系統を変えない）。
  - 現状 accent `#C0612F`(light)/`#E08A52`(dark) は v1 のたたき台。シグネチャーになる一色として再検討。
  - danger（削除）`#C62828`/`#EF5350` は機能色（ブランド色ではない）。
  - 両モードで WCAG AA 検証も同時に。
  - 発見: `feature/recipe-list-detail` 実機時のブランディング相談。
