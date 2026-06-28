// StackFlow - Frontend JavaScript

const COLORS = ['#A6E22E', '#F92672', '#66D9EF', '#FD971F', '#AE81FF', '#E6DB74'];

let currentStack = [];
let history = [];
let statusTimer = null;

const stackContainer = document.getElementById('stackContainer');
const stackInfo = document.getElementById('stackInfo');
const pushValue = document.getElementById('pushValue');
const pushBtn = document.getElementById('pushBtn');
const popBtn = document.getElementById('popBtn');
const peekBtn = document.getElementById('peekBtn');
const statusDiv = document.getElementById('status');
const historyList = document.getElementById('historyList');
document.addEventListener('DOMContentLoaded', function () {
    loadStack();
    loadHistory();
    pushBtn.addEventListener('click', handlePush);
    popBtn.addEventListener('click', handlePop);
    peekBtn.addEventListener('click', handlePeek);
    pushValue.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handlePush();
    });
});

function showStatus(msg, type) {
    if (statusTimer) clearTimeout(statusTimer);
    statusDiv.textContent = msg;
    if (type === 'success') statusDiv.style.color = '#A6E22E';
    else if (type === 'error') statusDiv.style.color = '#F92672';
    else if (type === 'loading') statusDiv.style.color = '#E6DB74';
    else statusDiv.style.color = '#66D9EF';
    if (type !== 'loading') {
        statusTimer = setTimeout(function () {
            statusDiv.textContent = 'Siap';
            statusDiv.style.color = '#66D9EF';
        }, 2000);
    }
}

function apiCall(url, method, body) {
    var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) { return r.json(); });
}

function loadStack() {
    apiCall('/api/stack').then(function (data) {
        if (data && data.stack) {
            currentStack = data.stack;
            renderStack();
        }
    });
}

function loadHistory() {
    apiCall('/api/history').then(function (logs) {
        if (Array.isArray(logs)) {
            history = logs;
            renderHistory();
        }
    });
}

function handlePush() {
    var value = pushValue.value.trim();
    if (!value) { showStatus('Masukkan nilai terlebih dahulu!', 'error'); pushValue.focus(); return; }
    pushBtn.disabled = true;
    showStatus('Push "' + value + '"...', 'loading');
    apiCall('/api/stack/push', 'POST', { value: value }).then(function (data) {
        if (data.success) {
            currentStack.unshift(value);
            renderStack();
            var first = stackContainer.firstElementChild;
            if (first) first.classList.add('push-anim');
            showStatus('Berhasil push "' + value + '" ke stack!', 'success');
            pushValue.value = '';
            loadHistory();
        } else {
            showStatus('Gagal: ' + data.error, 'error');
        }
        pushBtn.disabled = false;
        pushValue.focus();
    }).catch(function (err) {
        showStatus('Gagal: ' + err.message, 'error');
        pushBtn.disabled = false;
    });
}

function handlePop() {
    if (currentStack.length === 0) { showStatus('Stack kosong!', 'error'); return; }
    popBtn.disabled = true;
    showStatus('Pop...', 'loading');
    apiCall('/api/stack/pop', 'POST').then(function (data) {
        if (data.success) {
            var topEl = stackContainer.firstElementChild;
            if (topEl) {
                topEl.classList.add('pop-anim');
                setTimeout(function () {
                    currentStack.shift();
                    renderStack();
                }, 250);
            } else {
                currentStack.shift();
                renderStack();
            }
            showStatus('Berhasil pop "' + data.value + '" dari stack!', 'success');
            loadHistory();
        } else {
            showStatus('Gagal: ' + data.error, 'error');
        }
        popBtn.disabled = false;
    }).catch(function (err) {
        showStatus('Gagal: ' + err.message, 'error');
        popBtn.disabled = false;
    });
}

function handlePeek() {
    if (currentStack.length === 0) { showStatus('Stack kosong!', 'error'); return; }
    apiCall('/api/stack/peek').then(function (data) {
        if (data.success) {
            showStatus('Elemen puncak: "' + data.value + '"', 'info');
            var first = stackContainer.firstElementChild;
            if (first) {
                first.classList.add('peeking');
                setTimeout(function () { first.classList.remove('peeking'); }, 1500);
            }
            loadHistory();
        } else {
            showStatus('Gagal: ' + data.error, 'error');
        }
    });
}

function renderStack() {
    stackContainer.innerHTML = '';
    for (var i = 0; i < currentStack.length; i++) {
        var el = document.createElement('div');
        el.className = 'stack-element';
        el.textContent = currentStack[i];
        var color = COLORS[i % COLORS.length];
        el.style.borderColor = color;
        el.style.color = color;
        if (i === 0) {
            el.classList.add('top');
            el.style.boxShadow = '0 0 15px ' + color;
        }
        stackContainer.appendChild(el);
    }
    var top = currentStack.length > 0 ? currentStack[0] : 'null';
    stackInfo.textContent = 'Ukuran: ' + currentStack.length + ' | Atas: ' + top;
}

function renderHistory() {
    historyList.innerHTML = '';
    for (var i = 0; i < history.length; i++) {
        var entry = history[i];
        var div = document.createElement('div');
        div.className = 'history-item ' + entry.type;
        var icon = entry.type === 'push' ? '[+]' : entry.type === 'pop' ? '[-]' : '[?]';
        var label = entry.type === 'push' ? 'Push "' + entry.value + '"' :
                    entry.type === 'pop' ? 'Pop "' + entry.value + '"' :
                    'Peek -> "' + entry.value + '"';
        var time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('id-ID') : '';
        div.innerHTML = '<span style="color:#75715E">' + time + '</span> ' + icon + ' ' + label;
        historyList.appendChild(div);
    }
}
