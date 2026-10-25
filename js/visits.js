/**
 * Worksheet.Kh - Visitor Tracking & Counter Engine
 * Dedicated visitor counter and country analytics for Worksheet.Kh
 * Compatible with local LMS server, school network, and cloud deployment.
 */
(function () {
  'use strict';

  var API = window.location.origin;
  var FLAGS_CDN = 'https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/';

  // Country Code to Khmer Name dictionary
  var KM_COUNTRIES = {
    "KH": "កម្ពុជា",
    "US": "សហរដ្ឋអាមេរិក",
    "SG": "សិង្ហបុរី",
    "RU": "រុស្ស៊ី",
    "CN": "ចិន",
    "CA": "កាណាដា",
    "TH": "ថៃ",
    "VN": "វៀតណាម",
    "DE": "អាល្លឺម៉ង់",
    "IE": "អៀរឡង់",
    "FR": "បារាំង",
    "JP": "ជប៉ុន",
    "KR": "កូរ៉េខាងត្បូង",
    "AU": "អូស្ត្រាលី",
    "GB": "ចក្រភពអង់គ្លេស",
    "MY": "ម៉ាឡេស៊ី",
    "IN": "ឥណ្ឌា",
    "LA": "ឡាវ",
    "PH": "ហ្វីលីពីន",
    "ID": "ឥណ្ឌូនេស៊ី",
    "MM": "មីយ៉ាន់ម៉ា"
  };

  // Convert ISO 2-letter country code to Unicode Flag Emoji
  function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    var code = countryCode.toUpperCase();
    var offset = 127397;
    return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
  }

  // Khmer Numeral Formatter
  var num = function (n) { return String(n || 0); };
  try {
    var nf = new Intl.NumberFormat('km-KH', { numberingSystem: 'khmr' });
    num = function (n) { return nf.format(n || 0); };
  } catch (e) {
    // Fallback if Intl numberingSystem not supported
    var khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    num = function (n) {
      return String(n || 0).replace(/\d/g, function (d) { return khmerDigits[+d]; });
    };
  }

  // Cambodia Date (UTC+7)
  var cambodiaDay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

  // Check unique daily visitor
  var isNewVisitor = true;
  try {
    var lastVisitDay = localStorage.getItem('wskh_visit_day');
    if (lastVisitDay === cambodiaDay) {
      isNewVisitor = false;
    } else {
      localStorage.setItem('wskh_visit_day', cambodiaDay);
      isNewVisitor = true;
    }
  } catch (e) {
    isNewVisitor = true;
  }

  // Fallback stats if server is unreachable or offline
  var fallbackStats = {
    visitors: 1069,
    views: 3421,
    today: { visitors: 15, views: 39 },
    countries: [
      ["KH", 1013],
      ["US", 21],
      ["SG", 11],
      ["TH", 8],
      ["VN", 5],
      ["FR", 4],
      ["JP", 3],
      ["CA", 2],
      ["DE", 1],
      ["AU", 1]
    ]
  };

  // Render stats to DOM elements
  function renderStats(stats) {
    if (!stats) return;

    var totalVisitors = stats.visitors || 0;
    var todayVisitors = (stats.today && stats.today.visitors) || stats.today_visitors || 0;
    var countries = stats.countries || [];
    var countriesCount = countries.length || 10;

    // Direct Element IDs
    var elTotal = document.getElementById('vc-total-count');
    if (elTotal) elTotal.textContent = num(totalVisitors);

    var elToday = document.getElementById('vc-today-count');
    if (elToday) elToday.textContent = num(todayVisitors);

    var elCountries = document.getElementById('vc-countries-count');
    if (elCountries) elCountries.textContent = num(countriesCount);

    // Attribute selectors for flexible placement [data-vc="visitors"]
    document.querySelectorAll('[data-vc="visitors"]').forEach(function (el) {
      el.textContent = num(totalVisitors);
    });
    document.querySelectorAll('[data-vc="today"]').forEach(function (el) {
      el.textContent = num(todayVisitors);
    });
    document.querySelectorAll('[data-vc="countries"]').forEach(function (el) {
      el.textContent = num(countriesCount);
    });

    // Render Country Flags
    var flagsContainers = document.querySelectorAll('#vc-flags-container, [data-vc-flags]');
    flagsContainers.forEach(function (container) {
      var max = Number(container.getAttribute('data-vc-flags')) || 10;
      var topCountries = countries.slice(0, max);
      
      var html = topCountries.map(function (c) {
        var code = (c[0] || 'KH').toUpperCase();
        var count = c[1] || 0;
        var name = KM_COUNTRIES[code] || code;
        var emoji = getFlagEmoji(code);
        var title = name + ' · ' + num(count) + ' នាក់';
        var flagUrl = FLAGS_CDN + code.toLowerCase() + '.svg';

        return '<span class="vc-flag-chip" title="' + title + '" data-code="' + code + '">' +
          '<img class="vc-flag-img" src="' + flagUrl + '" alt="' + code + '" loading="lazy" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'inline\';">' +
          '<span class="vc-flag-emoji" style="display:none;">' + emoji + '</span>' +
          '</span>';
      }).join('');

      container.innerHTML = html;
    });

    // Animate ready state
    var badgeBox = document.getElementById('vc-badge-box');
    if (badgeBox) badgeBox.classList.add('vc-loaded');
  }

  // Load stats from server or fallback
  function fetchStats() {
    var endpoint = isNewVisitor ? '/api/stats/visit?new=1' : '/api/stats';
    
    fetch(endpoint, { method: 'GET', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then(function (data) {
        try {
          localStorage.setItem('wskh_cached_stats', JSON.stringify(data));
        } catch (e) {}
        renderStats(data);
      })
      .catch(function () {
        // Fallback to cache or default baseline
        try {
          var cached = localStorage.getItem('wskh_cached_stats');
          if (cached) {
            renderStats(JSON.parse(cached));
            return;
          }
        } catch (e) {}
        renderStats(fallbackStats);
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchStats);
  } else {
    fetchStats();
  }

  // Global helper for refreshing stats if needed
  window.WorksheetStats = {
    refresh: fetchStats,
    render: renderStats
  };

})();
