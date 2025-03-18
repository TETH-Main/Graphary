/**
 * HTTP POSTリクエストを処理する
 * @param {Object} e - リクエストオブジェクト
 * @return {Object} レスポンス
 */
function doPost(e) {
  try {
    // リクエストからJSONデータを解析
    const data = JSON.parse(e.postData.contents);
    const type = data.type;
    
    Logger.log("Received POST request with type: " + type);
    Logger.log("Request data: " + JSON.stringify(data));
    
    let result;
    
    // リクエストのタイプに応じて処理を分岐
    switch (type) {
      case 'formula':
        result = registerFormula(data);
        break;
      case 'report':
        result = registerReport(data);
        break;
      default:
        throw new Error('Unknown request type: ' + type);
    }
    
    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      result: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    
    // エラーレスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 数式を登録する
 * @param {Object} data - 数式データ
 * @return {Object} 登録結果
 */
function registerFormula(data) {
  try {
    Logger.log("Starting formula registration");
    
    const spreadsheetId = '139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM'; // スプレッドシートのID
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    Logger.log("Spreadsheet opened successfully");
    
    // 新しいタグがあれば先に登録して、IDを取得する
    let tagIds = [];
    
    // 既存のタグIDを配列に変換
    if (data.tags && data.tags.trim() !== '') {
      tagIds = data.tags.split(',').filter(id => id.trim() !== '');
      Logger.log("Existing tag IDs: " + tagIds.join(', '));
    }
    
    // 新しいタグがあれば登録してIDを取得
    if (data.newTags && data.newTags.trim() !== '') {
      Logger.log("Processing new tags: " + data.newTags);
      const newTagsArray = data.newTags.split(',').filter(tag => tag.trim() !== '');
      if (newTagsArray.length > 0) {
        // 新しいタグを登録してIDを取得
        const newTagIds = registerNewTags(newTagsArray, ss);
        Logger.log("New tag IDs registered: " + newTagIds.join(', '));
        // 既存のタグIDと新しいタグIDを結合
        tagIds = tagIds.concat(newTagIds);
      }
    }
    
    // タグIDをカンマ区切り文字列に変換
    const finalTagIds = tagIds.join(',');
    Logger.log("Final tag IDs: " + finalTagIds);
    
    // データシートを取得 - シート名を "inputData" に変更
    const dataSheet = ss.getSheetByName('inputData');
    if (!dataSheet) {
      Logger.log("inputData sheet not found!");
      throw new Error('inputDataシートが見つかりません');
    }
    
    Logger.log("inputData sheet found");
    
    // 最後の行を取得して次のIDを決定
    const lastRow = dataSheet.getLastRow();
    Logger.log("Last row in inputData sheet: " + lastRow);
    
    // IDは行番号（ヘッダー行を含む）
    const newId = lastRow + 1;
    Logger.log("New formula ID will be: " + newId);
    
    // 数式データを挿入
    const row = [
      newId, // ID
      data.title || '', // タイトル
      data.title_EN || '', // 英語タイトル（存在しない場合は空文字）
      data.formula || '', // 数式
      data.formula_type || '', // 数式タイプ
      finalTagIds, // 更新されたタグID（既存 + 新規）
      data.image_url || '', // 画像URL
      new Date() // 登録日時
    ];
    
    Logger.log("Inserting row data: " + JSON.stringify(row));
    
    dataSheet.appendRow(row);
    Logger.log("Row inserted successfully");
    
    return { 
      id: newId,
      tagIds: finalTagIds // タグIDも返す
    };
  } catch (error) {
    Logger.log("Error in registerFormula: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    throw error;
  }
}

/**
 * 新しいタグを登録する
 * @param {Array} newTags - 新しいタグ名の配列
 * @param {SpreadsheetApp.Spreadsheet} ss - スプレッドシートオブジェクト
 * @return {Array} 登録されたタグIDの配列
 */
function registerNewTags(newTags, ss) {
  try {
    Logger.log("Starting registration of new tags");
    
    // タグリストシートを取得
    const tagSheet = ss.getSheetByName('tagsList');
    if (!tagSheet) {
      Logger.log("tagsList sheet not found!");
      throw new Error('タグリストシートが見つかりません');
    }
    
    Logger.log("tagsList sheet found");
    
    // 最後の行を取得
    const lastRow = tagSheet.getLastRow();
    Logger.log("Last row in tagsList sheet: " + lastRow);
    
    // シートが空の場合はヘッダー行を追加
    if (lastRow === 0) {
      tagSheet.appendRow(['tagID', 'tagName', 'tagName_EN', 'Date']);
      Logger.log("Added header row to empty tagsList sheet");
    }
    
    // 既存のタグ名を取得してキャッシュ（重複チェック用）
    let existingTagNames = [];
    let existingTagsData = [];
    
    if (lastRow > 1) {
      // B2からB最終行までの範囲
      const existingTagsRange = tagSheet.getRange(2, 2, lastRow - 1, 1);
      existingTagsData = existingTagsRange.getValues();
      existingTagNames = existingTagsData.map(row => String(row[0]).toLowerCase());
      Logger.log("Existing tag names: " + existingTagNames.join(', '));
    }
    
    // 最後のタグIDを取得
    let lastTagId = 0;
    if (lastRow > 1) { // ヘッダー行以外にデータがある場合
      const lastIdCell = tagSheet.getRange(lastRow, 1);
      lastTagId = parseInt(lastIdCell.getValue()) || 0;
    }
    
    Logger.log("Last tag ID before adding new tags: " + lastTagId);
    
    const newTagIds = [];
    
    // 各新規タグを処理
    newTags.forEach(tagName => {
      // タグ名の正規化（トリムして重複チェック用に小文字化）
      const normalizedName = tagName.trim();
      const lowercaseName = normalizedName.toLowerCase();
      
      Logger.log("Processing tag: " + normalizedName);
      
      // 既存のタグリストに存在するかチェック
      const existingIndex = existingTagNames.indexOf(lowercaseName);
      
      if (existingIndex >= 0) {
        // 既存のタグがある場合は、そのIDを使用
        // +2 はヘッダー行のオフセット
        const existingTagIdRow = existingIndex + 2;
        const existingTagId = tagSheet.getRange(existingTagIdRow, 1).getValue();
        Logger.log(`Tag "${normalizedName}" already exists with ID ${existingTagId} at row ${existingTagIdRow}`);
        
        newTagIds.push(existingTagId);
      } else if (normalizedName) {
        // 新しいタグIDを生成
        const newTagId = lastTagId + 1;
        lastTagId = newTagId;  // 次のタグのために更新
        
        Logger.log(`Adding new tag: "${normalizedName}" with ID ${newTagId}`);
        
        // 新しいタグを追加
        tagSheet.appendRow([
          newTagId, // タグID
          normalizedName, // 日本語タグ名
          normalizedName, // 英語タグ名（初期値は日本語名と同じ、後で手動更新）
          new Date() // 登録日時
        ]);
        
        // 新しいタグIDを記録
        newTagIds.push(newTagId);
        
        // 既存タグリストに追加して重複チェックができるようにする
        existingTagNames.push(lowercaseName);
      }
    });
    
    Logger.log(`Registered ${newTagIds.length} tags with IDs: ${newTagIds.join(', ')}`);
    return newTagIds;
    
  } catch (error) {
    Logger.log("Error in registerNewTags: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    throw error;
  }
}

/**
 * 報告を登録する
 * @param {Object} data - 報告データ
 * @return {Object} 登録結果
 */
function registerReport(data) {
  const spreadsheetId = '139qGcw2VXJRZF_zBLJ-wL-Lh8--hHZEFd0I1YYVsnqM'; // スプレッドシートのID
  const ss = SpreadsheetApp.openById(spreadsheetId);
  
  // レポートシートを取得（存在しない場合は作成）
  let reportSheet = ss.getSheetByName('reports');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('reports');
    reportSheet.appendRow(['ID', 'Formula ID', 'Reason', 'Date']);
  }
  
  // 最後の行を取得して次のIDを決定
  const lastRow = reportSheet.getLastRow();
  const newId = lastRow; // IDは行番号-1（ヘッダー行を除く）
  
  // 報告データを挿入
  reportSheet.appendRow([
    newId,
    data.formulaId,
    data.reason,
    new Date()
  ]);
  
  return { id: newId };
}

/**
 * HTTP GETリクエストを処理する（データ取得用）
 * @param {Object} e - リクエストオブジェクト
 * @return {TextOutput} JSONレスポンス
 */
function doGet(e) {
  try {
    const id = e.parameter.id;
    const name = e.parameter.name;
    
    // パラメータのチェック
    if (!id || !name) {
      throw new Error('Invalid parameters. Both id and name are required.');
    }
    
    const spreadsheetId = id;
    const sheetName = name;
    
    // スプレッドシートを開く
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found.`);
    }
    
    // データ範囲を取得
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // ヘッダー行を取得
    const headers = values[0];
    
    // データ行をオブジェクトに変換
    const result = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const obj = {};
      
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      
      result.push(obj);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
