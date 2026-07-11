/**
 * events.js — Premium Interactive Events Timeline
 * SMYM Kanjirappally
 *
 * Features:
 *  - Loads events from data/events.json
 *  - Horizontal scrollable timeline with alternating above/below cards
 *  - Live countdown to next upcoming event
 *  - Upcoming / Past tab switch
 *  - Month dropdown jump navigation
 *  - Left/Right arrow navigation with smooth snap scrolling
 *  - Search by name
 *  - Click card to open detail modal
 *  - Scroll reveal animations
 */

'use strict';

const EVENTS = (() => {

    /* ═══════ STATE ═══════ */
    let allEvents = [];      // All parsed events from JSON
    let filtered  = [];      // Currently displayed subset
    let tab       = 'all'; // 'all' | 'upcoming' | 'past'
    let searchQ   = '';
    let countdownInterval = null;
    let nextEventObj = null;

    /* ═══════ MONTH NAMES ═══════ */
    const MONTHS_LONG  = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
    const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN',
                          'JUL','AUG','SEP','OCT','NOV','DEC'];

    /* ═══════ EVENT ICONS (by keyword) ═══════ */
    const ICONS = [
        [/pray|vigil|adoration|passi/i,    '🙏'],
        [/visit/i,                          '🏠'],
        [/cancer|blood|donation|health/i,  '❤️'],
        [/sports?|cricket|football|badmin|shuttle|volleyball|tournament/i, '🏆'],
        [/retreat|camp|camping/i,          '⛺'],
        [/meet|gather|assembly|senate|summit/i, '🤝'],
        [/mission|odisha|pathayathra/i,    '✈️'],
        [/youth/i,                          '🌟'],
        [/feast|easter|christmas|birth/i,  '🎉'],
        [/bible|reading|vibhuthi/i,        '📖'],
        [/quiz|exam|orientation|class/i,   '📚'],
        [/environment|cycle|farmers/i,     '🌿'],
        [/photo/i,                          '📸'],
        [/music|art|culture/i,             '🎨'],
        [/lead|train|workshop/i,           '🎯'],
        [/food|mayday|dinner/i,            '🍽️'],
        [/jubilee|anniversary|celebration/i,'🎊'],
        [/drug|anti/i,                     '🚫'],
    ];

    function iconFor(name) {
        for (const [re, icon] of ICONS) {
            if (re.test(name)) return icon;
        }
        return '📅';
    }

    /* ═══════ DATE PARSING ═══════ */
    /**
     * Parses a date string from the JSON. Handles:
     *  - ISO: "2026-03-15"
     *  - Text range: "20,21,22/03/2026" or "13-14,15/03/2026" or "01-08-09-2026"
     * Returns a Date object (using the first date if it's a range).
     */
    function parseDate(str) {
        if (!str) return null;

        // ISO date
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            const d = new Date(str);
            if (!isNaN(d)) return d;
        }

        // Various range formats: "DD[,/-]...DD/MM/YYYY" or "DD-MM-YYYY"
        // Try extracting first day number and last component as YYYY then MM
        const parts = str.replace(/[-,]/g, '/').split('/').filter(Boolean);
        if (parts.length >= 3) {
            const year  = parts.find(p => p.length === 4);
            const month = parts.find(p => p.length <= 2 && parseInt(p) >= 1 && parseInt(p) <= 12 && p !== parts[0]);
            const day   = parts[0];
            if (year && month && day) {
                const d = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
                if (!isNaN(d)) return d;
            }
        }

        return null;
    }

    function formatDate(d) {
        if (!d) return 'Date TBD';
        return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
    }

    function daysSince(d) {
        const now = new Date(); now.setHours(0,0,0,0);
        return Math.round((now - d) / 86400000);
    }

    /* ═══════ LOAD DATA ═══════ */
    async function init() {
        try {
            const res = await fetch('data/events.json');
            if (!res.ok) throw new Error('Failed to load events.json');
            const raw = await res.json();

            // Enrich each event with parsed date and metadata
            allEvents = raw.map((ev, i) => {
                const date = parseDate(ev.date);
                const now  = new Date(); now.setHours(0,0,0,0);
                const isPast = date ? date < now : false;
                return {
                    id:      i,
                    rawDate: ev.date,
                    name:    ev.name,
                    date,
                    isPast,
                    icon:    iconFor(ev.name),
                };
            }).filter(e => e.date); // Only events with parseable dates

            // Sort chronologically
            allEvents.sort((a, b) => a.date - b.date);

            // Find the next upcoming event
            const now = new Date(); now.setHours(0,0,0,0);
            nextEventObj = allEvents.find(e => !e.isPast && e.date >= now) || null;

            buildMonthDropdown();
            render();
            startCountdown();
            setupScrollReveal();

        } catch (err) {
            console.error('[EVENTS]', err);
        }
    }

    /* ═══════ MONTH DROPDOWN ═══════ */
    function buildMonthDropdown() {
        const select = document.getElementById('ev-month-select');
        if (!select) return;

        // Collect unique year-month combos from events matching current tab
        const months = new Set();
        allEvents.forEach(e => {
            const key = `${e.date.getFullYear()}-${String(e.date.getMonth()+1).padStart(2,'0')}`;
            months.add(key);
        });

        const sorted = [...months].sort();
        sorted.forEach(key => {
            const [y, m] = key.split('-');
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${MONTHS_LONG[parseInt(m)-1]} ${y}`;
            select.appendChild(opt);
        });
    }

    /* ═══════ RENDER ═══════ */
    function render() {
        const container = document.getElementById('ev-cards-container');
        const emptyEl   = document.getElementById('ev-empty-state');
        const section   = document.getElementById('ev-timeline-section');
        if (!container) return;

        // Filter events by tab + search
        const now = new Date(); now.setHours(0,0,0,0);
        filtered = allEvents.filter(e => {
            const matchTab = tab === 'all' ? true : (tab === 'upcoming' ? !e.isPast : e.isPast);
            const matchQ   = !searchQ || e.name.toLowerCase().includes(searchQ.toLowerCase());
            return matchTab && matchQ;
        });

        // Sort past events in reverse (most recent first)
        if (tab === 'past') filtered = [...filtered].reverse();

        container.innerHTML = '';

        if (filtered.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (section) section.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (section) section.style.display = 'block';

        filtered.forEach((ev, i) => {
            const isAbove = i % 2 === 0;
            const isNext  = nextEventObj && ev.id === nextEventObj.id;

            const card = document.createElement('div');
            card.className = `ev-card ${isAbove ? 'above' : 'below'}${isNext ? ' is-next' : ''}`;
            card.dataset.id = ev.id;
            card.style.animationDelay = `${i * 55}ms`;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `${ev.name}, ${formatDate(ev.date)}`);

            // Date display
            const day   = ev.date.getDate();
            const mon   = MONTHS_SHORT[ev.date.getMonth()];
            const year  = ev.date.getFullYear();
            const isRange = /[,\/]/.test(ev.rawDate) && !/^\d{4}-/.test(ev.rawDate);

            const statusClass = ev.isPast ? 'past' : 'upcoming';
            const statusLabel = ev.isPast ? 'Past' : (isNext ? 'Next Event' : 'Upcoming');

            card.innerHTML = `
                <div class="ev-card-connector"></div>
                <div class="ev-card-dot"></div>
                <div class="ev-card-inner">
                    ${isNext ? '<span class="ev-next-card-badge">NEXT EVENT</span>' : ''}
                    ${isRange
                        ? `<div class="ev-card-date-range">${ev.rawDate}</div>`
                        : `<div class="ev-card-date-day">${day}</div>
                           <span class="ev-card-date-mon">${mon}</span>
                           <span class="ev-card-date-yr">${year}</span>`
                    }
                    <div class="ev-card-name">${titleCase(ev.name)}</div>
                    <span class="ev-card-status-label ${statusClass}">${statusLabel}</span>
                </div>
            `;

            card.addEventListener('click', () => openModal(ev));
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(ev); });

            container.appendChild(card);
        });

        // Auto-scroll to next event if on upcoming or all tab
        if ((tab === 'upcoming' || tab === 'all') && nextEventObj) {
            requestAnimationFrame(() => scrollToNext());
        }
    }

    function titleCase(str) {
        return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    }

    /* ═══════ SCROLL HELPERS ═══════ */
    const SCROLL_AMOUNT = 480; // pixels per arrow click

    function scrollTimeline(dir) {
        const outer = document.getElementById('ev-timeline-outer');
        if (!outer) return;
        outer.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
    }

    function scrollToNext() {
        const outer = document.getElementById('ev-timeline-outer');
        const container = document.getElementById('ev-cards-container');
        if (!outer || !nextEventObj) return;

        const card = container?.querySelector('.ev-card.is-next');
        if (!card) return;

        setTimeout(() => {
            const outerRect = outer.getBoundingClientRect();
            const cardRect  = card.getBoundingClientRect();
            const offset = cardRect.left - outerRect.left - (outer.clientWidth / 2) + (card.offsetWidth / 2);
            outer.scrollBy({ left: offset, behavior: 'smooth' });
        }, 400);
    }

    function jumpToMonth(value) {
        if (!value) return;
        const [y, m] = value.split('-').map(Number);
        const container = document.getElementById('ev-cards-container');
        const outer = document.getElementById('ev-timeline-outer');
        if (!container || !outer) return;

        const cards = container.querySelectorAll('.ev-card');
        for (const card of cards) {
            const ev = filtered[parseInt(card.dataset.id)];
            if (!ev) continue;
            // Match by month/year via the card's position in filtered
            const idx = parseInt([...cards].indexOf(card));
            const evObj = filtered[idx];
            if (!evObj) continue;
            if (evObj.date.getFullYear() === y && evObj.date.getMonth() + 1 === m) {
                const outerRect = outer.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                const offset = cardRect.left - outerRect.left - 80;
                outer.scrollBy({ left: offset, behavior: 'smooth' });
                break;
            }
        }
    }

    /* ═══════ TAB SWITCH ═══════ */
    function switchTab(newTab) {
        tab = newTab;
        document.getElementById('ev-tab-all')?.classList.toggle('active', tab === 'all');
        document.getElementById('ev-tab-upcoming')?.classList.toggle('active', tab === 'upcoming');
        document.getElementById('ev-tab-past')?.classList.toggle('active', tab === 'past');
        render();
    }

    /* ═══════ SEARCH ═══════ */
    function onSearch(q) {
        searchQ = q;
        render();
    }

    /* ═══════ COUNTDOWN ═══════ */
    function startCountdown() {
        if (!nextEventObj) {
            const wrapper = document.getElementById('ev-countdown-wrapper');
            if (wrapper) wrapper.style.display = 'none';
            return;
        }

        const nameEl = document.getElementById('ev-next-name');
        if (nameEl) nameEl.textContent = titleCase(nextEventObj.name);

        if (countdownInterval) clearInterval(countdownInterval);

        function tick() {
            const now  = new Date();
            const diff = nextEventObj.date - now;

            if (diff <= 0) {
                clearInterval(countdownInterval);
                setCounterDisplay(0, 0, 0, 0);
                return;
            }

            const days  = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins  = Math.floor((diff % 3600000) / 60000);
            const secs  = Math.floor((diff % 60000) / 1000);

            setCounterDisplay(days, hours, mins, secs);
        }

        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    function setCounterDisplay(d, h, m, s) {
        const fmt = n => String(n).padStart(2, '0');
        const el = id => document.getElementById(id);
        if (el('ev-cd-days'))  el('ev-cd-days').textContent  = fmt(d);
        if (el('ev-cd-hours')) el('ev-cd-hours').textContent = fmt(h);
        if (el('ev-cd-mins'))  el('ev-cd-mins').textContent  = fmt(m);
        if (el('ev-cd-secs'))  el('ev-cd-secs').textContent  = fmt(s);
    }

    /* ═══════ MODAL ═══════ */
    function openModal(ev) {
        const modal    = document.getElementById('ev-modal');
        const backdrop = document.getElementById('ev-modal-backdrop');
        if (!modal || !backdrop) return;

        const day    = ev.date ? ev.date.getDate() : '--';
        const mon    = ev.date ? MONTHS_SHORT[ev.date.getMonth()] : '--';
        const year   = ev.date ? ev.date.getFullYear() : '--';
        const isRange = /[,\/]/.test(ev.rawDate) && !/^\d{4}-/.test(ev.rawDate);

        document.getElementById('ev-modal-day').textContent   = isRange ? '📆' : day;
        document.getElementById('ev-modal-month').textContent = isRange ? ev.rawDate : mon;
        document.getElementById('ev-modal-year').textContent  = isRange ? '' : year;
        document.getElementById('ev-modal-title').textContent = titleCase(ev.name);
        document.getElementById('ev-modal-badge').textContent = ev.icon;
        document.getElementById('ev-modal-full-date').textContent = isRange
            ? `Date Range: ${ev.rawDate}`
            : formatDate(ev.date);

        const statusEl = document.getElementById('ev-modal-status');
        statusEl.textContent = ev.isPast ? 'Past Event' : 'Upcoming';
        statusEl.className = `ev-modal-status ${ev.isPast ? 'past' : 'upcoming'}`;

        const ctEl = document.getElementById('ev-modal-countdown-text');
        if (ev.isPast) {
            const ago = daysSince(ev.date);
            ctEl.textContent = ago === 0 ? 'Today' : `${ago} day${ago > 1 ? 's' : ''} ago`;
        } else if (nextEventObj && ev.id === nextEventObj.id) {
            ctEl.textContent = '🔥 Next Event';
        } else if (ev.date) {
            const now = new Date(); now.setHours(0,0,0,0);
            const diff = Math.round((ev.date - now) / 86400000);
            ctEl.textContent = diff === 0 ? 'Today!' : `In ${diff} day${diff > 1 ? 's' : ''}`;
        } else {
            ctEl.textContent = '';
        }

        modal.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('ev-modal')?.classList.remove('open');
        document.getElementById('ev-modal-backdrop')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ═══════ SCROLL REVEAL ═══════ */
    function setupScrollReveal() {
        // IntersectionObserver handles card reveal animations via CSS
        // The cards have animation-delay set in the render loop
    }

    /* ═══════ KEYBOARD ═══════ */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft')  scrollTimeline(-1);
        if (e.key === 'ArrowRight') scrollTimeline(1);
    });

    /* ═══════ PUBLIC API ═══════ */
    return { init, switchTab, onSearch, jumpToMonth, scrollTimeline, openModal, closeModal };

})();

// Boot
document.addEventListener('DOMContentLoaded', EVENTS.init);
