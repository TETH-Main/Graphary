/**
 * POSTリクエストを処理する関数
 * @param {Object} e - イベントオブジェクト
 * @returns {Object} レスポンス
 */
function doPost(e) {
  try {
    // リクエストデータをパース
    const data = JSON.parse(e.postData.contents);
    
    // 現在のスプレッドシートを取得（紐づいているため、IDは不要）
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // シート名を指定（複数シートがある場合に重要）
    const sheet = spreadsheet.getSheetByName('inputData'); // ここに実際のシート名を入力
    
    // 最後の行を取得
    const lastRow = sheet.getLastRow();
    const newId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    if (data.type === 'formula') {
      // 数式データを挿入
      sheet.appendRow([
        newId,                // ID
        data.title,           // タイトル
        data.formula_type,    // 数式タイプ
        data.tags,            // タグ
        data.formula,         // 数式
        data.image_url        // 画像URL（Imgurハッシュ）
      ]);
    } else if (data.type === 'report') {
      // 報告データを挿入
      const reportSheet = spreadsheet.getSheetByName('reports'); // 報告用のシート名を指定
      reportSheet.appendRow([
        newId,                // ID
        data.formulaId,       // 数式ID
        data.reason           // 報告理由
      ]);
    }
    
    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'データが正常に登録されました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーレスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'エラーが発生しました: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
