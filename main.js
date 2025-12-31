const initialMap = [
    [0, 0, 1, 0, 3],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 1, 2, 0],
    [0, 0, 0, 0, 0]
];

let map = [];
let player = { x: 0, y: 4, dir: 0, hasSample: false };

var workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    scrollbars: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
    trashcan: true
});

workspace.addChangeListener(() => {
    const code = javascript.javascriptGenerator.workspaceToCode(workspace);
    document.getElementById('jsCode').textContent = code || "";
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function log(msg) {
    const box = document.getElementById('consoleOutput');
    box.innerHTML += `<div>> ${msg}</div>`;
    box.scrollTop = box.scrollHeight;
}

function render() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    
    for(let y=0; y<5; y++) {
        for(let x=0; x<5; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if(map[y][x] === 1) { cell.textContent = '🪨'; cell.classList.add('rock'); }
            if(map[y][x] === 2) { cell.textContent = '💎'; cell.classList.add('gem'); }
            if(map[y][x] === 3) { cell.textContent = '🏁'; cell.classList.add('base'); }

            if(x === player.x && y === player.y) {
                cell.classList.add('rover');
                const arrows = ['⬆️', '➡️', '⬇️', '⬅️'];
                cell.textContent = arrows[player.dir];
            }
            grid.appendChild(cell);
        }
    }
}

function resetGame() {
    map = JSON.parse(JSON.stringify(initialMap));
    player = { x: 0, y: 4, dir: 0, hasSample: false };
    document.getElementById('consoleOutput').innerHTML = 'System Ready...';
    render();
}

async function moveForward() {
    await sleep(400);
    
    let nx = player.x;
    let ny = player.y;

    if(player.dir === 0) ny--;
    if(player.dir === 1) nx++;
    if(player.dir === 2) ny++;
    if(player.dir === 3) nx--;

    if(nx < 0 || nx > 4 || ny < 0 || ny > 4) {
        log('Error: Wall Boundary!');
        throw new Error('Wall');
    }
    if(map[ny][nx] === 1) {
        log('CRASH: Hit a Rock!');
        throw new Error('Rock');
    }

    player.x = nx;
    player.y = ny;
    render();

    if(map[ny][nx] === 2) {
        player.hasSample = true;
        map[ny][nx] = 0;
        log('Sample Collected!');
    }
    if(map[ny][nx] === 3) {
        if(player.hasSample) {
            log(' SUCCESS: Mission Accomplished!');
            alert('Mission Success!');
        } else {
            log('Info: At Base, need Sample.');
        }
    }
}

async function turn(action) {
    await sleep(200);
    if(action === 'right') player.dir = (player.dir + 1) % 4;
    if(action === 'left') player.dir = (player.dir + 3) % 4;
    if(action === 'around') player.dir = (player.dir + 2) % 4;
    render();
}

function check(type) {
    let nx = player.x, ny = player.y;
    if(player.dir === 0) ny--;
    if(player.dir === 1) nx++;
    if(player.dir === 2) ny++;
    if(player.dir === 3) nx--;

    if(nx < 0 || nx > 4 || ny < 0 || ny > 4) return false;

    if(type === 'path') return map[ny][nx] !== 1;
    if(type === 'sample') return map[ny][nx] === 2;
    return false;
}

const createBlock = (id, text, color) => {
    Blockly.Blocks[id] = {
        init: function() {
            this.appendDummyInput().appendField(text);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour(color);
        }
    };
};

createBlock('move_forward', '🚀 Move Forward', 160);
createBlock('turn_right', '↪️ Turn Right', 160);
createBlock('turn_left', '↩️ Turn Left', 160);
createBlock('turn_around', '🔄 Turn Around', 160);

Blockly.Blocks['is_path_clear'] = {
    init: function() {
        this.appendDummyInput().appendField("Path Clear?");
        this.setOutput(true, "Boolean");
        this.setColour(210);
    }
};

Blockly.Blocks['check_for_sample'] = {
    init: function() {
        this.appendDummyInput().appendField("Found Sample?");
        this.setOutput(true, "Boolean");
        this.setColour(210);
    }
};

javascript.javascriptGenerator.forBlock['move_forward'] = () => 'await moveForward();\n';
javascript.javascriptGenerator.forBlock['turn_right'] = () => 'await turn("right");\n';
javascript.javascriptGenerator.forBlock['turn_left'] = () => 'await turn("left");\n';
javascript.javascriptGenerator.forBlock['turn_around'] = () => 'await turn("around");\n';
javascript.javascriptGenerator.forBlock['is_path_clear'] = () => ['check("path")', javascript.Order.ATOMIC];
javascript.javascriptGenerator.forBlock['check_for_sample'] = () => ['check("sample")', javascript.Order.ATOMIC];

async function runCode() {
    resetGame();
    log("Parsing instructions...");
    const code = javascript.javascriptGenerator.workspaceToCode(workspace);
    const wrappedCode = `(async () => { try { ${code} } catch(e) { console.error(e); } })();`;
    
    try {
        eval(wrappedCode);
    } catch(e) {
        log("Syntax Error: " + e);
    }
}

window.addEventListener('resize', () => Blockly.svgResize(workspace), false);

resetGame();