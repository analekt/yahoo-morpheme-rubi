import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { clientId, text } = await request.json();

    if (!clientId || !text) {
      return NextResponse.json(
        { error: 'Client IDとテキストが必要です' },
        { status: 400 }
      );
    }

    const response = await fetch('https://jlp.yahooapis.jp/MAService/V2/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Yahoo AppID: ' + clientId,
      },
      body: JSON.stringify({
        id: Date.now().toString(),
        jsonrpc: '2.0',
        method: 'jlp.maservice.parse',
        params: {
          q: text,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Yahoo APIエラー: ' + response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: 'Yahoo APIエラー: ' + data.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}