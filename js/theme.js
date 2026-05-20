// ============================================================
// Tata Kelola One — Theme System
// ============================================================
(function () {
    'use strict';

    var THEME_KEY = 'vitta_theme';

    // ---------- 1. Apply saved theme class to <body> ASAP ----------
    var saved = localStorage.getItem(THEME_KEY) || 'dark';
    if (saved !== 'dark') {
        document.body.classList.add('theme-' + saved);
    }

    // ---------- 2. Inject CSS overrides ----------
    if (!document.getElementById('vitta-theme-css')) {
        var css = '';

        // ====== LIGHT BLUE ======
        css += 'body.theme-light { background-color: #f0f9ff !important; }';

        // backgrounds
        css += 'body.theme-light .bg-gray-900,'
             + 'body.theme-light .bg-dark-900 { background-color: #f0f9ff !important; }';
        css += 'body.theme-light .bg-dark-800 { background-color: #ffffff !important; box-shadow: 0 1px 4px rgba(0,0,0,.06); }';
        css += 'body.theme-light .bg-dark-700 { background-color: #e0f2fe !important; }';
        css += 'body.theme-light .bg-dark-600 { background-color: #bae6fd !important; }';

        // borders
        css += 'body.theme-light .border-dark-700 { border-color: #bae6fd !important; }';
        css += 'body.theme-light .border-dark-600 { border-color: #7dd3fc !important; }';

        // text
        css += 'body.theme-light .text-gray-100 { color: #1e293b !important; }';
        css += 'body.theme-light .text-white { color: #0f172a !important; }';
        css += 'body.theme-light .text-gray-300 { color: #475569 !important; }';
        css += 'body.theme-light .text-gray-400 { color: #64748b !important; }';
        css += 'body.theme-light .text-gray-500 { color: #94a3b8 !important; }';

        // keep active menu item readable
        css += 'body.theme-light .bg-blue-600 { background-color: #0ea5e9 !important; }';
        css += 'body.theme-light .bg-blue-600 .text-white,'
             + 'body.theme-light .bg-blue-600.text-white { color: #fff !important; }';

        // hover
        css += 'body.theme-light .hover\\:bg-dark-700:hover { background-color: #e0f2fe !important; }';
        css += 'body.theme-light .hover\\:bg-dark-600:hover { background-color: #bae6fd !important; }';
        css += 'body.theme-light .hover\\:text-white:hover { color: #0369a1 !important; }';

        // admin pages
        css += 'body.theme-light .bg-gray-100 { background-color: #f0f9ff !important; }';
        css += 'body.theme-light .bg-gray-800 { background-color: #ffffff !important; box-shadow: 2px 0 8px rgba(0,0,0,.05); }';
        css += 'body.theme-light .bg-blue-800 { background-color: #0ea5e9 !important; }';
        css += 'body.theme-light .border-gray-800 { border-color: #bae6fd !important; }';
        css += 'body.theme-light .text-gray-200 { color: #334155 !important; }';
        css += 'body.theme-light .bg-white { background-color: #ffffff !important; }';
        css += 'body.theme-light .shadow-xl { box-shadow: 0 2px 8px rgba(0,0,0,.08) !important; }';

        // ====== MIDNIGHT PURPLE ======
        css += 'body.theme-purple { background-color: #0c0a1d !important; }';

        // backgrounds
        css += 'body.theme-purple .bg-gray-900,'
             + 'body.theme-purple .bg-dark-900 { background-color: #0c0a1d !important; }';
        css += 'body.theme-purple .bg-dark-800 { background-color: #16103a !important; }';
        css += 'body.theme-purple .bg-dark-700 { background-color: #201752 !important; }';
        css += 'body.theme-purple .bg-dark-600 { background-color: #2a1f6a !important; }';

        // borders
        css += 'body.theme-purple .border-dark-700 { border-color: #251d55 !important; }';
        css += 'body.theme-purple .border-dark-600 { border-color: #3a2d7a !important; }';

        // accents blue → purple
        css += 'body.theme-purple .bg-blue-600 { background-color: #7c3aed !important; }';
        css += 'body.theme-purple .bg-blue-500 { background-color: #8b5cf6 !important; }';
        css += 'body.theme-purple .text-blue-500 { color: #a78bfa !important; }';
        css += 'body.theme-purple .text-blue-400 { color: #c4b5fd !important; }';
        css += 'body.theme-purple .hover\\:text-blue-400:hover { color: #c4b5fd !important; }';

        // hover
        css += 'body.theme-purple .hover\\:bg-dark-700:hover { background-color: #201752 !important; }';
        css += 'body.theme-purple .hover\\:bg-dark-600:hover { background-color: #2a1f6a !important; }';

        // admin pages
        css += 'body.theme-purple .bg-gray-100 { background-color: #0c0a1d !important; }';
        css += 'body.theme-purple .bg-gray-800 { background-color: #16103a !important; }';
        css += 'body.theme-purple .bg-blue-800 { background-color: #5b21b6 !important; }';
        css += 'body.theme-purple .text-gray-200 { color: #c4b5fd !important; }';
        css += 'body.theme-purple .bg-white { background-color: #1e1650 !important; color: #e2d9f3 !important; }';
        css += 'body.theme-purple .text-gray-500 { color: #8b7fc7 !important; }';
        css += 'body.theme-purple .border-blue-500 { border-color: #7c3aed !important; }';
        css += 'body.theme-purple .border-blue-600 { border-color: #7c3aed !important; }';
        css += 'body.theme-purple .border-gray-800 { border-color: #251d55 !important; }';
        css += 'body.theme-purple .shadow-xl { box-shadow: 0 4px 20px rgba(10,5,30,.5) !important; }';

        var style = document.createElement('style');
        style.id = 'vitta-theme-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------- 3. Theme picker UI ----------
    var THEMES = [
        { id: 'dark',   name: 'Gelap (Default)',    desc: 'Tema gelap dengan aksen biru',      colors: ['#111827','#1f2937','#3b82f6'] },
        { id: 'light',  name: 'Terang Biru Muda',   desc: 'Putih dominan, aksen biru muda',    colors: ['#f0f9ff','#ffffff','#0ea5e9'] },
        { id: 'purple', name: 'Midnight Purple',     desc: 'Gelap elegan dengan aksen ungu',    colors: ['#0c0a1d','#16103a','#8b5cf6'] }
    ];

    function buildPicker() {
        if (document.getElementById('vitta-theme-picker')) return;

        var current = localStorage.getItem(THEME_KEY) || 'dark';

        // --- Floating button ---
        var wrap = document.createElement('div');
        wrap.id = 'vitta-theme-picker';
        wrap.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;font-family:Inter,system-ui,sans-serif;';

        var btn = document.createElement('button');
        btn.title = 'Pilih Tema';
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 14h.5a2.5 2.5 0 0 0 2.5-2.5c0-.6-.2-1.1-.6-1.5-.4-.4-.6-.9-.6-1.5A2.5 2.5 0 0 1 16.5 8H19a7 7 0 0 0-7-6z"/><circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="11.5" r="1.5" fill="currentColor"/></svg>';
        setBtnColors(btn, current);
        btn.style.cssText += ';width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid;transition:transform .2s,box-shadow .2s;';
        btn.onmouseenter = function(){ btn.style.transform='scale(1.12)'; btn.style.boxShadow='0 4px 16px rgba(0,0,0,.3)'; };
        btn.onmouseleave = function(){ btn.style.transform='scale(1)'; btn.style.boxShadow='none'; };

        // --- Dropdown panel ---
        var panel = document.createElement('div');
        panel.style.cssText = 'display:none;position:absolute;right:0;top:50px;width:270px;border-radius:14px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);';
        setPanelColors(panel, current);

        var title = document.createElement('div');
        title.textContent = '🎨 Pilih Tema';
        title.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(128,128,128,.25);';
        panel.appendChild(title);

        THEMES.forEach(function(t) {
            var row = document.createElement('div');
            var active = t.id === current;
            row.style.cssText = 'display:flex;align-items:center;padding:9px 10px;border-radius:10px;cursor:pointer;margin-bottom:4px;border:2px solid ' + (active ? '#3b82f6' : 'transparent') + ';transition:background .15s;';
            if (active) row.style.backgroundColor = 'rgba(59,130,246,.08)';
            row.onmouseenter = function(){ if(!active) row.style.backgroundColor='rgba(128,128,128,.12)'; };
            row.onmouseleave = function(){ if(!active) row.style.backgroundColor='transparent'; };

            // color dots
            var dots = document.createElement('div');
            dots.style.cssText = 'display:flex;gap:3px;margin-right:10px;flex-shrink:0;';
            t.colors.forEach(function(c){
                var d = document.createElement('div');
                d.style.cssText = 'width:16px;height:16px;border-radius:50%;border:2px solid rgba(128,128,128,.3);background:'+c;
                dots.appendChild(d);
            });

            // label
            var label = document.createElement('div');
            label.style.cssText = 'flex:1;min-width:0;';
            var n = document.createElement('div');
            n.textContent = t.name;
            n.style.cssText = 'font-weight:600;font-size:12px;';
            var desc = document.createElement('div');
            desc.textContent = t.desc;
            desc.style.cssText = 'font-size:10px;opacity:.55;margin-top:1px;';
            label.appendChild(n);
            label.appendChild(desc);

            row.appendChild(dots);
            row.appendChild(label);

            if (active) {
                var chk = document.createElement('span');
                chk.textContent = '✓';
                chk.style.cssText = 'color:#3b82f6;font-weight:bold;font-size:15px;margin-left:6px;';
                row.appendChild(chk);
            }

            row.onclick = function() { applyTheme(t.id); };
            panel.appendChild(row);
        });

        // toggle
        var open = false;
        btn.onclick = function(e) {
            e.stopPropagation();
            open = !open;
            panel.style.display = open ? 'block' : 'none';
        };
        document.addEventListener('click', function() { open = false; panel.style.display = 'none'; });
        panel.onclick = function(e) { e.stopPropagation(); };

        wrap.appendChild(btn);
        wrap.appendChild(panel);
        document.body.appendChild(wrap);
    }

    function setBtnColors(btn, theme) {
        var map = {
            dark:   { bg:'#1f2937', fg:'#9ca3af', bc:'#374151' },
            light:  { bg:'#ffffff', fg:'#0ea5e9', bc:'#bae6fd' },
            purple: { bg:'#16103a', fg:'#a78bfa', bc:'#251d55' }
        };
        var c = map[theme] || map.dark;
        btn.style.backgroundColor = c.bg;
        btn.style.color = c.fg;
        btn.style.borderColor = c.bc;
    }

    function setPanelColors(panel, theme) {
        var map = {
            dark:   { bg:'#1f2937', bc:'#374151', fg:'#e5e7eb' },
            light:  { bg:'#ffffff', bc:'#bae6fd', fg:'#1e293b' },
            purple: { bg:'#16103a', bc:'#251d55', fg:'#e2d9f3' }
        };
        var c = map[theme] || map.dark;
        panel.style.backgroundColor = c.bg;
        panel.style.border = '1px solid ' + c.bc;
        panel.style.color = c.fg;
    }

    function applyTheme(id) {
        document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim();
        if (id !== 'dark') {
            document.body.classList.add('theme-' + id);
        }
        localStorage.setItem(THEME_KEY, id);

        // rebuild picker to reflect new active state
        var old = document.getElementById('vitta-theme-picker');
        if (old) old.remove();
        buildPicker();
    }

    // ---------- 4. Init ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildPicker);
    } else {
        buildPicker();
    }
})();
