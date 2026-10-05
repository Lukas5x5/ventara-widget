// Ventara Booking Widget — Embed Script (v2)
// Usage:
//   <div id="ventara-booking"></div>
//   <script src="https://lukas5x5.github.io/ventara-widget/embed.js" data-operator="YOUR-UUID"></script>
(function () {
  var script = document.currentScript;
  var operatorId = script.getAttribute('data-operator');
  var lang = script.getAttribute('data-lang') || '';
  var container = document.getElementById('ventara-booking') || script.parentElement;

  if (!operatorId) {
    console.error('[Ventara Widget] Missing data-operator attribute');
    return;
  }

  var baseUrl = script.src.replace(/\/embed\.js.*/, '');
  var iframeSrc = baseUrl + '/?operator=' + encodeURIComponent(operatorId);
  if (lang) iframeSrc += '&lang=' + encodeURIComponent(lang);

  var iframe = document.createElement('iframe');
  iframe.src = iframeSrc;
  iframe.style.width = '100%';
  iframe.style.height = '600px'; // initial — will be replaced by postMessage
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.style.colorScheme = 'light';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Ventara Booking');
  iframe.setAttribute('allow', 'payment');
  iframe.setAttribute('scrolling', 'no');

  // Auto-resize iframe based on inner content height
  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return;
    if (e.data && e.data.type === 'ventara-resize' && typeof e.data.height === 'number') {
      iframe.style.height = (e.data.height + 8) + 'px';
    }
  });

  container.appendChild(iframe);
})();
