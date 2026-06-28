// StackFlow - Frontend JavaScript
// Menangani interaksi UI, animasi, dan panggilan API

// --- State ---
let currentStack = [];
let history = [];

// --- DOM Elements ---
const stackContainer = document.getElementById('stackContainer');
const stackInfo = document.getElementById('stackInfo');
const pushValue = document.getElementById('pushValue');
const pushBtn = document.getElementById('pushBtn');
const popBtn = document.getElementById('popBtn');
const peekBtn = document.getElementById('peekBtn');
const statusDiv = document.getElementById('status');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    loadStack();
    loadHistory();
    setupEventListeners();
});

function setupEventListeners() {
    pushBtn.addEventListener('click', handlePush);
    popBtn.addEventListener('click', handlePop);
    peekBtn.addEventListener('click', handlePeek);
    clearHistoryBtn.addEventListener('click', handleClearHistory);
    pushValue.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePush();
    });
}

// --- API Calls ---
async function apiCall(url, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function loadStack() {
    const data = await apiCall('/api/stack');
    if (data.stack) {
        currentStack = data.stack;
        renderStack();
        updateInfo(data.size);
    }
}

async function loadHistory() {
    const logs = await apiCall('/api/history');
    if (Array.isArray(logs)) {
        history = logs.map(entry => ({
            type: entry.type,
            value: entry.value,
            time: entry.timestamp
                ? new Date(entry.timestamp).toLocaleTimeString('id-ID')
                : ''
        }));
        renderHistory();
    }
}

// --- Event Handlers ---
async function handlePush() {
    const value = pushValue.value.trim();
    if (!value) {
        showStatus('Masukkan nilai terlebih dahulu!', 'error');
        pushValue.focus();
        return;
    }

    pushBtn.disabled = true;
    showStatus(`Push "${value}"...`, 'loading');

    const data = await apiCall('/api/stack/push', 'POST', { value });

    if (data.success) {
        currentStack.push(value);
        renderStack(data.size);
        showStatus(`Berhasil push "${value}" ke stack!`, 'success');
        pushValue.value = '';
        loadHistory();
    } else {
        showStatus(`Gagal: ${data.error}`, 'error');
    }

    pushBtn.disabled = false;
    pushValue.focus();
}

async function handlePop() {
    if (currentStack.length === 0) {
        showStatus('Stack kosong! Tidak ada elemen untuk di-pop.', 'error');
        return;
    }

    popBtn.disabled = true;
    const topValue = currentStack[currentStack.length - 1];
    showStatus(`Pop "${topValue}"...`, 'loading');

    const lastElement = stackContainer.lastElementChild;
    if (lastElement) {
        lastElement.classList.add('poping');
        await sleep(300);
    }

    const data = await apiCall('/api/stack/pop', 'POST');

    if (data.success) {
        currentStack.pop();
        renderStack(data.size);
        showStatus(`Berhasil pop "${data.value}" dari stack!`, 'success');
        loadHistory();
    } else {
        showStatus(`Gagal: ${data.error}`, 'error');
    }

    popBtn.disabled = false;
}

async function handlePeek() {
    if (currentStack.length === 0) {
        showStatus('Stack kosong! Tidak ada elemen untuk di-peek.', 'error');
        return;
    }

    const data = await apiCall('/api/stack/peek');

    if (data.success) {
        showStatus(`Elemen puncak: "${data.value}"`, 'info');

        const lastElement = stackContainer.lastElementChild;
        if (lastElement) {
            lastElement.classList.add('peeking');
            setTimeout(() => lastElement.classList.remove('peeking'), 1500);
        }
        loadHistory();
    } else {
        showStatus(`Gagal: ${data.error}`, 'error');
    }
}

// --- Rendering ---
function renderStack(size) {
    stackContainer.innerHTML = '';

    currentStack.forEach((value, index) => {
        const el = document.createElement('div');
        el.className = 'stack-element';
        el.textContent = value;

        // Color based on index
        const colorIndex = index % COLORS.length;
        const color = COLORS[colorIndex];
        el.style.borderColor = color;
        el.style.color = color;
        el.style.backgroundColor = `${color}22`;

        // Mark top element
        if (index === currentStack.length - 1) {
            el.classList.add('top');
            el.style.boxShadow = `0 0 15px ${color}`;
            el.style.backgroundColor = `${color}33`;
        }

        stackContainer.appendChild(el);
    });

    updateInfo(size || currentStack.length);
}

function updateInfo(size) {
    const top = currentStack.length > 0
        ? currentStack[currentStack.length - 1]
        : 'null';
    stackInfo.textContent = `Ukuran: ${size || 0} | Atas: ${top}`;
}

// --- History ---
async function handleClearHistory() {
    await apiCall('/api/history', 'DELETE');
    history = [];
    renderHistory();
    showStatus('Riwayat dihapus!', 'success');
}

function renderHistory() {
    historyList.innerHTML = '';

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = `history-item ${entry.type}`;

        let icon = '';
        let action = '';
        switch (entry.type) {
            case 'push':
                icon = '[+]';
                action = `Push "${entry.value}"`;
                break;
            case 'pop':
                icon = '[-]';
                action = `Pop "${entry.value}"`;
                break;
            case 'peek':
                icon = '[?]';
                action = `Peek -> "${entry.value}"`;
                break;
        }

        item.innerHTML = `<span style="color:#75715E">${entry.time}</span> ${icon} ${action}`;
        historyList.appendChild(item);
    });
}

// --- Status ---
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;

    switch (type) {
        case 'success':
            statusDiv.style.color = '#A6E22E';
            break;
        case 'error':
            statusDiv.style.color = '#F92672';
            break;
        case 'loading':
            statusDiv.style.color = '#E6DB74';
            break;
        default:
            statusDiv.style.color = '#66D9EF';
    }
}

// --- Utility ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
