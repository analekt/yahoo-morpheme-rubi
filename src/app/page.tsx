'use client';

import { useState } from 'react';
import { splitTextIntoChunks, isOnlyJoyoKanji, formatWithRuby, separateOkurigana } from '@/lib/utils';

export default function Home() {
  const [clientId, setClientId] = useState('');
  const [saveClientId, setSaveClientId] = useState(false);
  const [skipRange, setSkipRange] = useState(80);
  const [useJoyoFilter, setUseJoyoFilter] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'xhtml' | 'bracket'>('xhtml');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleProcess = async () => {
    if (!clientId.trim()) {
      setErrorMessage('Client IDを入力してください');
      return;
    }

    if (!inputText.trim()) {
      setErrorMessage('テキストを入力してください');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('テキストを分析中...');
    setErrorMessage('');

    try {
      // テキストをチャンクに分割
      const chunks = splitTextIntoChunks(inputText);
      setStatusMessage(`${chunks.length}個のチャンクに分割しました`);

      let processedText = '';
      const processedWords = new Set<string>();

      for (let i = 0; i < chunks.length; i++) {
        setStatusMessage(`チャンク ${i + 1}/${chunks.length} を処理中...`);

        const response = await fetch('/api/morpheme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: clientId,
            text: chunks[i],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API呼び出しエラー');
        }

        const data = await response.json();
        
        if (data.result && data.result.tokens) {
          let chunkText = chunks[i];
          const replacements: Array<{ start: number; end: number; replacement: string }> = [];

          for (const token of data.result.tokens) {
            const surface = token[0]; // 表層形
            const reading = token[1]; // 読み

            // 常用漢字フィルタリング（常用漢字のみの単語をスキップ）
            if (useJoyoFilter && isOnlyJoyoKanji(surface)) {
              continue;
            }

            // スキップ範囲チェック
            if (skipRange > 0 && processedWords.has(surface)) {
              const lastIndex = processedText.lastIndexOf(surface);
              if (lastIndex >= 0 && processedText.length - lastIndex < skipRange) {
                continue;
              }
            }

            // 読みがなが必要か判定（ひらがな・カタカナのみの場合はスキップ）
            if (/^[\u3040-\u309F\u30A0-\u30FF]+$/.test(surface)) {
              continue;
            }

            // 表層形と読みが同じ場合はスキップ
            if (surface === reading) {
              continue;
            }

            const index = chunkText.indexOf(surface);
            if (index !== -1) {
              // 送り仮名を分離
              const { kanjiPart, kanjiReading, okurigana } = separateOkurigana(surface, reading);
              
              let rubyText: string;
              if (okurigana) {
                // 送り仮名がある場合：漢字部分のみにルビを付け、送り仮名はそのまま
                const kanjiWithRuby = formatWithRuby(kanjiPart, kanjiReading, outputFormat);
                rubyText = kanjiWithRuby + okurigana;
              } else {
                // 送り仮名がない場合：全体にルビを付与
                rubyText = formatWithRuby(surface, reading, outputFormat);
              }
              
              replacements.push({
                start: index,
                end: index + surface.length,
                replacement: rubyText,
              });
              processedWords.add(surface);
            }
          }

          // 後ろから順に置換（インデックスがずれないように）
          replacements.sort((a, b) => b.start - a.start);
          for (const replacement of replacements) {
            chunkText = 
              chunkText.substring(0, replacement.start) +
              replacement.replacement +
              chunkText.substring(replacement.end);
          }

          processedText += chunkText;
        } else {
          processedText += chunks[i];
        }

        // 少し待機（レート制限対策）
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setOutputText(processedText);
      setStatusMessage(`完了 - ${chunks.length}個のチャンクを処理しました`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '処理中にエラーが発生しました');
      setStatusMessage('エラー');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          読みがな付与ツール
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {/* Client ID入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yahoo! Developer NetworkのClient IDを入力"
              />
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={saveClientId}
                    onChange={(e) => setSaveClientId(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Client IDを保存</span>
                </label>
              </div>
            </div>

            {/* 設定オプション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スキップ範囲（文字数）
                </label>
                <input
                  type="number"
                  value={skipRange}
                  onChange={(e) => setSkipRange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  title="読みがなスキップ範囲"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  常用漢字フィルタ
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useJoyoFilter}
                    onChange={(e) => setUseJoyoFilter(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">常用漢字を除外</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出力形式
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as 'xhtml' | 'bracket')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="出力形式選択"
                >
                  <option value="xhtml">XHTML方式</option>
                  <option value="bracket">墨つき括弧方式</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* テキスト入力エリア */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            入力テキスト（最大100万文字）
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="読みがなを付与したいテキストを入力してください"
          />
          <div className="mt-2 text-right text-sm text-gray-500">
            {inputText.length.toLocaleString()} / 1,000,000文字
          </div>
        </div>

        {/* 処理ボタン */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!clientId.trim() || isProcessing}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? '処理中...' : '読みがなを付与'}
          </button>
        </div>

        {/* ステータスバー */}
        {statusMessage && (
          <div className="bg-blue-100 border border-blue-300 rounded-md p-3 mb-4">
            <div className="text-blue-800 text-sm font-medium">
              ステータス: {statusMessage}
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
            <div className="text-red-800 text-sm font-medium">
              エラー: {errorMessage}
            </div>
          </div>
        )}

        {/* 出力テキストエリア */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出力テキスト
          </label>
          <textarea
            value={outputText}
            readOnly
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 resize-none"
            placeholder="処理結果がここに表示されます"
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {outputText.length.toLocaleString()}文字
            </span>
            {outputText && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(outputText)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                コピー
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}