// Global variables
let robotData = [];
let players = [];
let currentEditingPlayer = null;

// Skill levels
const SKILL_LEVELS = {
    'メイン機': { value: 4, color: 'bg-green-500', textColor: 'text-white' },
    'サブ機': { value: 3, color: 'bg-blue-500', textColor: 'text-white' },
    '一応乗れる': { value: 2, color: 'bg-yellow-500', textColor: 'text-white' },
    '自信なし': { value: 1, color: 'bg-orange-500', textColor: 'text-white' },
    '使えない': { value: 0, color: 'bg-red-500', textColor: 'text-white' }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadRobotData();
    initializeDefaultPlayers();
    setupEventListeners();
    renderTable();
});

// Load robot data from JSON
async function loadRobotData() {
    try {
        const response = await fetch('./data/robots.json');
        robotData = await response.json();
        console.log('Robot data loaded:', robotData.length, 'robots');
    } catch (error) {
        console.error('Failed to load robot data:', error);
        // Fallback data
        robotData = [
            { category: 'テムジン', name: '747A', ratio: 6 },
            { category: 'フェイイェン', name: 'PH', ratio: 4 }
        ];
    }
}

// Initialize with default players
function initializeDefaultPlayers() {
    players = [
        { id: 1, name: 'あんのーん', skills: {} },
        { id: 2, name: 'おたいき', skills: {} },
        { id: 3, name: 'たっちん', skills: {} }
    ];
    
    // Initialize skills with default values
    players.forEach(player => {
        robotData.forEach(robot => {
            const key = `${robot.category}_${robot.name}`;
            player.skills[key] = '自信なし';
        });
    });
    
    updatePlayerList();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('addPlayer').addEventListener('click', showPlayerModal);
    document.getElementById('cancelPlayerAdd').addEventListener('click', hidePlayerModal);
    document.getElementById('confirmPlayerAdd').addEventListener('click', addPlayer);
    document.getElementById('generateTeam').addEventListener('click', generateOptimalTeam);
    document.getElementById('pointLimit').addEventListener('change', updatePointLimit);
    
    // Enter key support for player name input
    document.getElementById('playerNameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
}

// Player management functions
function showPlayerModal() {
    document.getElementById('playerModal').classList.remove('hidden');
    document.getElementById('playerModal').classList.add('flex');
    document.getElementById('playerNameInput').focus();
}

function hidePlayerModal() {
    document.getElementById('playerModal').classList.add('hidden');
    document.getElementById('playerModal').classList.remove('flex');
    document.getElementById('playerNameInput').value = '';
}

function addPlayer() {
    const nameInput = document.getElementById('playerNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('プレイヤー名を入力してください');
        return;
    }
    
    if (players.some(p => p.name === name)) {
        alert('同じ名前のプレイヤーが既に存在します');
        return;
    }
    
    const newPlayer = {
        id: Date.now(),
        name: name,
        skills: {}
    };
    
    // Initialize skills with default values
    robotData.forEach(robot => {
        const key = `${robot.category}_${robot.name}`;
        newPlayer.skills[key] = '自信なし';
    });
    
    players.push(newPlayer);
    updatePlayerList();
    renderTable();
    hidePlayerModal();
}

function removePlayer(playerId) {
    if (players.length <= 1) {
        alert('最低1人のプレイヤーが必要です');
        return;
    }
    
    if (confirm('このプレイヤーを削除しますか？')) {
        players = players.filter(p => p.id !== playerId);
        updatePlayerList();
        renderTable();
    }
}

function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'flex items-center justify-between bg-gray-50 rounded-lg p-3';
        
        playerDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="font-medium text-gray-800">${player.name}</span>
            </div>
            <button onclick="removePlayer(${player.id})" 
                    class="text-red-500 hover:text-red-700 transition-colors">
                🗑️
            </button>
        `;
        
        playerList.appendChild(playerDiv);
    });
}

// Table rendering
function renderTable() {
    const table = document.getElementById('robotTable');
    const thead = table.querySelector('thead tr');
    const tbody = document.getElementById('robotTableBody');
    
    // Update table headers
    thead.innerHTML = `
        <th class="px-4 py-3 text-left font-semibold">分類</th>
        <th class="px-4 py-3 text-left font-semibold">機体名</th>
        <th class="px-4 py-3 text-center font-semibold">レシオ</th>
        ${players.map(player => `<th class="px-4 py-3 text-center font-semibold">${player.name}</th>`).join('')}
    `;
    
    // Update table body
    tbody.innerHTML = '';
    
    robotData.forEach(robot => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50 transition-colors';
        
        const robotKey = `${robot.category}_${robot.name}`;
        
        row.innerHTML = `
            <td class="px-4 py-3 text-gray-800">${robot.category}</td>
            <td class="px-4 py-3 font-medium text-gray-900">${robot.name}</td>
            <td class="px-4 py-3 text-center">
                <span class="ratio-badge text-white px-2 py-1 rounded-full text-sm font-semibold">
                    ${robot.ratio}
                </span>
            </td>
            ${players.map(player => {
                const skill = player.skills[robotKey] || '自信なし';
                const skillInfo = SKILL_LEVELS[skill];
                return `
                    <td class="px-4 py-3 text-center">
                        <button onclick="cycleSkill('${player.name}', '${robotKey}')" 
                                class="skill-button px-3 py-1 rounded-full text-sm font-medium ${skillInfo.color} ${skillInfo.textColor}">
                            ${skill}
                        </button>
                    </td>
                `;
            }).join('')}
        `;
        
        tbody.appendChild(row);
    });
}

// Skill cycling
function cycleSkill(playerName, robotKey) {
    const player = players.find(p => p.name === playerName);
    if (!player) return;
    
    const currentSkill = player.skills[robotKey];
    const skillLevels = Object.keys(SKILL_LEVELS);
    const currentIndex = skillLevels.indexOf(currentSkill);
    const nextIndex = (currentIndex + 1) % skillLevels.length;
    
    player.skills[robotKey] = skillLevels[nextIndex];
    renderTable();
}

// Point limit update
function updatePointLimit() {
    const pointLimit = document.getElementById('pointLimit').value;
    console.log('Point limit updated to:', pointLimit);
}

// Team generation algorithm
function generateOptimalTeam() {
    const pointLimit = parseInt(document.getElementById('pointLimit').value);
    const results = [];
    
    players.forEach(player => {
        const playerResult = findOptimalCombination(player, pointLimit);
        results.push({
            player: player.name,
            combination: playerResult.combination,
            totalPoints: playerResult.totalPoints,
            totalSkillValue: playerResult.totalSkillValue
        });
    });
    
    displayResults(results);
}

function findOptimalCombination(player, pointLimit) {
    const availableRobots = robotData.map(robot => {
        const robotKey = `${robot.category}_${robot.name}`;
        const skill = player.skills[robotKey];
        const skillValue = SKILL_LEVELS[skill].value;
        
        return {
            ...robot,
            skillValue: skillValue,
            key: robotKey
        };
    }).filter(robot => robot.skillValue > 0); // Only include usable robots
    
    // Sort by skill value (descending) then by ratio (ascending for better value)
    availableRobots.sort((a, b) => {
        if (b.skillValue !== a.skillValue) {
            return b.skillValue - a.skillValue;
        }
        return a.ratio - b.ratio;
    });
    
    let bestCombination = [];
    let bestSkillValue = 0;
    
    // Try different combinations using dynamic programming approach
    function trySubsetCombination(robots, currentCombo, currentPoints, currentSkillValue, startIndex) {
        if (currentPoints <= pointLimit && currentSkillValue > bestSkillValue) {
            bestCombination = [...currentCombo];
            bestSkillValue = currentSkillValue;
        }
        
        for (let i = startIndex; i < robots.length; i++) {
            const robot = robots[i];
            if (currentPoints + robot.ratio <= pointLimit) {
                trySubsetCombination(
                    robots,
                    [...currentCombo, robot],
                    currentPoints + robot.ratio,
                    currentSkillValue + robot.skillValue,
                    i + 1
                );
            }
        }
    }
    
    trySubsetCombination(availableRobots, [], 0, 0, 0);
    
    return {
        combination: bestCombination,
        totalPoints: bestCombination.reduce((sum, robot) => sum + robot.ratio, 0),
        totalSkillValue: bestSkillValue
    };
}

function displayResults(results) {
    const resultsPanel = document.getElementById('resultsPanel');
    const teamResults = document.getElementById('teamResults');
    
    teamResults.innerHTML = '';
    
    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'bg-gray-50 rounded-lg p-4';
        
        const robotList = result.combination.map(robot => {
            const skill = SKILL_LEVELS[Object.keys(SKILL_LEVELS).find(key => 
                SKILL_LEVELS[key].value === robot.skillValue
            )];
            return `
                <div class="flex justify-between items-center py-1">
                    <span class="font-medium">${robot.category} ${robot.name}</span>
                    <div class="flex items-center space-x-2">
                        <span class="ratio-badge text-white px-2 py-1 rounded text-xs">R:${robot.ratio}</span>
                        <span class="${skill.color} ${skill.textColor} px-2 py-1 rounded text-xs">${Object.keys(SKILL_LEVELS).find(key => SKILL_LEVELS[key].value === robot.skillValue)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        resultDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-semibold text-gray-800">${result.player}</h3>
                <div class="text-sm text-gray-600">
                    ${result.totalPoints}PT / スキル値: ${result.totalSkillValue}
                </div>
            </div>
            <div class="space-y-1">
                ${robotList}
            </div>
        `;
        
        teamResults.appendChild(resultDiv);
    });
    
    resultsPanel.classList.remove('hidden');
}
