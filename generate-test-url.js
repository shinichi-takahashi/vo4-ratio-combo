const fs = require('fs');
const LZString = require('lz-string');

// CSVデータを読み込み
const csvData = fs.readFileSync('スミさん大会チーム Whole Japan（仮） - シート1.csv', 'utf8');

// ロボットデータを読み込み
const robotData = JSON.parse(fs.readFileSync('src/data/robots.json', 'utf8'));

// 機体名を短縮IDにマップ
const robotNameToId = new Map();
robotData.forEach((robot, index) => {
  robotNameToId.set(robot.name, index);
});

// CSVを解析
const lines = csvData.split('\n');
const headers = lines[0].split(',');

// プレイヤー名を取得（3列目以降）
const playerNames = headers.slice(3);
console.log('プレイヤー:', playerNames);

// プレイヤーデータを作成
const players = playerNames.map((name, playerIndex) => ({
  n: name.trim(), // name -> n
  s: {} // skills -> s
}));

// 各行のデータを処理
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const cells = line.split(',');
  if (cells.length < 4) continue;
  
  const category = cells[0];
  const robotName = cells[1];
  const ratio = cells[2];
  
  // レシオが"-"の場合はスキップ
  if (ratio === '-') continue;
  
  // CSVの機体名をrobots.jsonの正しい名前にマッピング
  let fullRobotName;
  
  // 特別なケースのマッピング（robots.jsonが正）
  const nameMapping = {
    // テムジン
    'テムジン,10/80': '10/80',
    
    // ガラヤカ
    'ガラヤカ,ガラヤカ': 'ガラヤカ',
    
    // バル（robots.jsonの正確な名前に合わせる）
    'バル,メオラ': 'バル・ディ・メオラ',
    'バル,チスタ': 'バル・バ・チスタ',
    'バル,ティグラ': 'バル・バ・ティグラ',
    'バル,リーノ': 'バル・メ・リーノ',
    'バル,ランダ': 'バル・ミ・ランダ',
    'バル,リムゾ': 'バル・セ・リムゾ'
  };
  
  const mappingKey = `${category},${robotName}`;
  if (nameMapping[mappingKey]) {
    fullRobotName = nameMapping[mappingKey];
  } else {
    // 通常の結合
    fullRobotName = `${category} ${robotName}`;
  }
  
  // 機体IDを取得
  let robotId = robotNameToId.get(fullRobotName);
  
  if (robotId === undefined) {
    console.warn(`Robot not found: ${fullRobotName} (original: ${category} ${robotName})`);
    continue;
  }
  
  // 各プレイヤーのスキルを設定
  for (let j = 0; j < playerNames.length; j++) {
    const skillText = cells[3 + j];
    if (!skillText || skillText.trim() === '') continue;
    
    // スキルレベルを数値に変換
    let skillValue = 0;
    switch (skillText.trim()) {
      case 'メイン機': skillValue = 4; break;
      case 'サブ機': skillValue = 3; break;
      case '一応乗れる': skillValue = 2; break;
      case '自信なし': skillValue = 1; break;
      case '使えない': skillValue = 0; break;
      default: skillValue = 0;
    }
    
    // 使えない以外のみ保存
    if (skillValue > 0) {
      players[j].s[robotId] = skillValue;
    }
  }
}

// データを圧縮
const jsonString = JSON.stringify(players);
const compressed = LZString.compressToEncodedURIComponent(jsonString);

// URL生成
const baseUrl = 'https://shinichi-takahashi.github.io/vo4-ratio-combo/';
const testUrl = `${baseUrl}?data=${compressed}`;

console.log('\n=== 生成されたテストURL ===');
console.log(testUrl);
console.log('\n=== URLの長さ ===');
console.log(`${testUrl.length} 文字`);
console.log('\n=== 圧縮前のデータサイズ ===');
console.log(`JSON: ${jsonString.length} 文字`);
console.log(`圧縮率: ${((1 - compressed.length / jsonString.length) * 100).toFixed(1)}%`);
